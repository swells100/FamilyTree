var CLIENT_ID = '792319409454-gfo9169f0a11idboe7khn5f3a9v5khdh.apps.googleusercontent.com';
var API_KEY = 'AIzaSyD3slHGehg5t6aMrqgN_J_twlFzGIE2pVo';

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = [
    "https://sheets.googleapis.com/$discovery/rest?version=v4", 
    "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"
];

// Authorization scopes required by the API; multiple scopes can be included, separated by spaces.
var SCOPES = "https://www.googleapis.com/auth/spreadsheets.readonly";

/**
 * On load, called to load the FedCM API.
 */
function handleClientLoad() {
    // Load Google login via FedCM.
    if (window.FedCM) {
        initFedCMClient();
    } else {
        console.error("FedCM is not supported in this browser.");
    }
}

/**
 * Initializes the API client library and sets up sign-in state listeners.
 */
function initFedCMClient() {
    // Make an authenticated request with FedCM
    FedCM.requestCredential({
        client_id: CLIENT_ID,
        scope: SCOPES,
        federated_sign_in: 'google'  // Specify the Google provider
    })
    .then(credential => {
        if (credential) {
            // Use the credential to authenticate the API client
            authenticateWithGoogle(credential);
        } else {
            console.log("No credentials returned");
        }
    })
    .catch(error => {
        console.log("Error during FedCM authentication:", error);
    });
}

/**
 * Authenticate the user with the Google API using the credential from FedCM.
 */
function authenticateWithGoogle(credential) {
    // Now you can use the credential to make authorized API requests.
    // For example, make a request to Google Sheets API:
    gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
    }).then(function() {
        // You can pass the credential as part of your API requests if needed
        // Get sheet data here, for example:
        getSheetValues();
    }).catch(function(error) {
        console.error("Failed to initialize API client:", error);
    });
}
  
  // Manually simulate component lifecycle (in a non-Angular environment)
  const app = new AppComponent();
  app.ngAfterViewInit();

// Get raw spreadsheet data and convert it into a dope-ass data structure.
function getSheetValues() {
    console.log("Getting sheet values...")

    // Get the spreadsheet bits and do stuff to em
    gapi.client.sheets.spreadsheets.values.batchGet({
        spreadsheetId: '1Ep5BEB79E5VgSY7JnK971dlidknzGFI3VNQFncPMEcA',
        ranges: ['Siblings!A2:H', 'Size Settings!A2:B', 'Misc Settings!A2:B', 'Tag Settings!A2:N', 'Conjunction Grid!A1:N', 'Container Settings!A2:E']
      }).then((response) => {
        ranges = response.result.valueRanges
        settings = {}
        parseTags(ranges[3])
        placeSiblings(ranges[0])
        parseSizeSettings(ranges[1])
        parseMiscSettings(ranges[2])
        parseConjunctionGrid(ranges[4])
        createContainerSettings(ranges[5])
        appElement.settings = settings

        main()
      })
}

// Get raw spreadsheet data and convert it into a dope-ass data structure
function placeSiblings(result) {
    // Log the number of siblings
    var numRows = result.values ? result.values.length : 0
    console.log(`${numRows} siblings retrieved.`)

    // Put all siblings into a JSON structure. This only works if the sheet is properly sorted and there are no spelling errors.
    siblings = []
    result.values.forEach(val => {
        sibJSON = sibRowToJSON(val)
        // If the sib has no big, they're at height 0.
        if (sibJSON.bigName === null) {
            // If they have no house, they're in the Lone Wolves or Asphodel
            if (sibJSON.house === null) {
                //console.log(sibJSON.pledgeClass)
                if (sibJSON.pledgeClass == "Alpha") sibJSON.house = "Lone Wolves"
                else sibJSON.house = "Asphodel Clan"
            }

            // Place them in the structure at height 0
            sibJSON.height = 0
            siblings.push(sibJSON)
        }
        else {
            sibJSON.big = siblings.find(sib => sib.name == sibJSON.bigName)
            if (sibJSON.big == undefined) console.log(`ERROR: ${sibJSON.bigName} is not a valid big!`)

            // If they have no house, inherit their big's
            if (sibJSON.house === null) sibJSON.house = sibJSON.big.house

            // Add themselves to their big's list of littles
            sibJSON.big.littles.push(sibJSON)

            // Put em in the array!
            sibJSON.height = sibJSON.big.height+1
            siblings.push(sibJSON)
        }
    })

    siblings.sort(recursiveSiblingSort)

    // Add siblings to their tags' references and connect them if they have otherselves
    siblings.forEach(sib => {
        house = getTag(sib.house)
        house.taggedSibs.push(sib)
        house.taggedSibs.sort(function(a, b) { return a.pledgeClassNumber - b.pledgeClassNumber })
        sib.tags.forEach(tagName => {
            tag = getTag(tagName)
            tag.taggedSibs.push(sib)
            tag.taggedSibs.sort(function(a, b) { return a.pledgeClassNumber - b.pledgeClassNumber })
        })

        sib.otherselves = []
        sib.otherselvesNames.forEach(otherselfName => {
            otherself = siblings.find(sib => sib.name == otherselfName)
            sib.otherselves.push(otherself)
        })
    })
        
    console.log("All Siblings:")
    console.log(siblings)
}

// Convert tag set into a usable json
function parseTags(result) {
    defaultTagData = []
    result.values.forEach(row => {
        tag = tagRowToJSON(row)
        defaultTagData.push(tag)
    })

    settings.tagData = defaultTagData

    console.log("Tags:")
    console.log(settings.tagData)
}

// Translate the Conjunction Grid
function parseConjunctionGrid(result) {
    conjunctionGrid = {}
    romTypes = result.values[0]
    result.values.forEach(row => {
        if (row != romTypes)  {
            thisRowIDs = {}
            for (i = 1; i < row.length; i++) {
                if (row[i] != '') thisRowIDs[romTypes[i]] = { imageAddress: row[i] }
            }
            conjunctionGrid[row[0]] = thisRowIDs
        }
    })

    settings.conjunctionGrid = conjunctionGrid

    console.log("Conjunction Grid:")
    console.log(settings.conjunctionGrid)
}

// Apply default size settings given by spreadsheet
function parseSizeSettings(result) {
    defaultSizes = {}
    docStyle = document.body.style
    result.values.forEach(row => defaultSizes[cleanStr(row[0])] = parseInt(row[1]))

    nameHeight = defaultSizes['nameHeight']
    lineHeight = defaultSizes['lineHeight']
    blockHeight = nameHeight + 2*lineHeight
    defaultSizes['blockHeight'] = blockHeight

    settings.sizes = defaultSizes

    console.log("Size Settings:")
    console.log(settings.sizes)
}

// Apply any misc settings given by spreadsheet
function parseMiscSettings(result) {
    result.values.forEach(row => settings[cleanStr(row[0])] = row[1])

    console.log("All Settings:")
    console.log(settings)
}

// Apply default container settings given by spreadsheet
function createContainerSettings(result) {
    containers = []
    docStyle = document.body.style
    result.values.forEach(function(row) {
        container = containerRowToJSON(row)
        containers.push(container)
    })

    settings.containers = containers

    console.log("Containers:")
    console.log(settings.containers)
}