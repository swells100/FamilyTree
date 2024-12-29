// var CLIENT_ID = '792319409454-gfo9169f0a11idboe7khn5f3a9v5khdh.apps.googleusercontent.com';
// var API_KEY = 'AIzaSyD3slHGehg5t6aMrqgN_J_twlFzGIE2pVo';

// // Array of API discovery doc URLs for APIs used by the quickstart
// var DISCOVERY_DOCS = [
//     "https://sheets.googleapis.com/$discovery/rest?version=v4", 
//     "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"
// ];

// // Authorization scopes required by the API; multiple scopes can be included, separated by spaces.
// var SCOPES = "https://www.googleapis.com/auth/spreadsheets.readonly";

// /**
//  * On load, called to load the auth2 library and API client library.
//  */
// function handleClientLoad() {
//     gapi.load('client:auth2', initClient);
// }

// /**
//  * Initializes the API client library and sets up sign-in state listeners.
//  */
// function initClient() {
//     gapi.client.init({
//         apiKey: API_KEY,
//         clientId: CLIENT_ID,
//         discoveryDocs: DISCOVERY_DOCS,
//         scope: SCOPES
//     }).then(function () {
//         // Sign in if not already signed in
//         if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
//             getSheetValues();
//         } else {
//             gapi.auth2.getAuthInstance().signIn().then(getSheetValues);
//         }
//     }, function (error) {
//         console.log(error);
//     });
// }

class AppComponent {
    constructor() {
        // Initialization code if necessary
    }

    // This function will now handle everything
    handleClientLoad() {
        // Ensure the google object exists and initialize the sign-in process
        if (window.google && google.accounts && google.accounts.id) {
            google.accounts.id.initialize({
                client_id: "792319409454-gfo9169f0a11idboe7khn5f3a9v5khdh.apps.googleusercontent.com",
                callback: (response) => this.handleGoogleSignIn(response)  // Handle sign-in response
            });

            google.accounts.id.renderButton(
                document.getElementById("buttonDiv"),
                { size: "large", type: "icon", shape: "pill" }  // customization attributes
            );
        } else {
            console.error("Google API not loaded.");
        }
    }

    // Handles the Google sign-in callback
    handleGoogleSignIn(response) {
        console.log("Google Sign-In successful:", response);

        // Decode the idToken to extract user information
        let base64Url = response.credential.split('.')[1];
        let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        let jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const decoded = JSON.parse(jsonPayload);
        console.log("Decoded ID Token:", decoded);

        // Now we can proceed with Google API client initialization and Sheets API request
        this.loadGoogleSheetData();
    }

    // Initialize Google API client and load data from the Google Sheet
    loadGoogleSheetData() {
        gapi.load('client', () => {
            gapi.client.init({
                apiKey: 'AIzaSyD3slHGehg5t6aMrqgN_J_twlFzGIE2pVo',  // API Key
                clientId: '792319409454-gfo9169f0a11idboe7khn5f3a9v5khdh.apps.googleusercontent.com',  // Client ID
                discoveryDocs: [
                    "https://sheets.googleapis.com/$discovery/rest?version=v4",
                    "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"
                ],
                scope: "https://www.googleapis.com/auth/spreadsheets.readonly"  // Scopes required
            }).then(() => {
                // Now we can make the Sheets API call to fetch data
                this.getSheetData();
            }).catch((error) => {
                console.error("Error initializing the Google API client:", error);
            });
        });
    }

// Get raw spreadsheet data and convert it into a dope-ass data structure.
getSheetValues() {
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
placeSiblings(result) {
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
parseTags(result) {
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
parseConjunctionGrid(result) {
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
parseSizeSettings(result) {
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
parseMiscSettings(result) {
    result.values.forEach(row => settings[cleanStr(row[0])] = row[1])

    console.log("All Settings:")
    console.log(settings)
}

// Apply default container settings given by spreadsheet
createContainerSettings(result) {
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
}

const app = new AppComponent();
app.handleClientLoad();