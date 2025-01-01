// Prepares a string to be used as a class name
function cleanStr(string) {
    newStr = string.replace(/ |\'|\"|\.|\+|\!|@/g, '')
    return newStr
}

// Makes invisible text invisible
function filterInvisText(string) {
    newStr = string.split('_')[0]
    return newStr
}

// Makes special text not special
function unspecialText(string) {
    newStr = filterInvisText(string).replace(/@/g, 'o')
    return newStr
}

// Converts a single sibling into a JSON format
// NOTE: row will trim all empty strings at the end of its array.
// Solve this by keeping pledgeClassNumber at the furthest right column.
function sibRowToJSON(row) {
    sibJSON = {}
    sibJSON.name = row[0]
    sibJSON.pledgeClass = row[1]
    sibJSON.pledgeClassNumber = parseInt(row[7])
    sibJSON.gradYear = row[2]
    sibJSON.bigName = row[3] == '' ?  null : row[3]
    sibJSON.littles = []
    sibJSON.house = row[4] == '' ? null : row[4]
    sibJSON.tags = row[5] == '' ? [] : row[5].split(';')
    sibJSON.otherselvesNames = row[6] == '' ? [] : row[6].split(';')

    return sibJSON
}

// Converts a single set of tag data into a JSON format
function tagRowToJSON(row) {
    tagJSON = {}
    tagJSON.name = row[0]
    tagJSON.iconClassName = cleanStr(row[0]) + "Icon"
    tagJSON.description = row[1]
    tagJSON.taggedSibs = []
    tagJSON.relatedTags = row[2] == '' ? [] : row[2].split(';')
    tagJSON.type = row[3]
    if (row[4] != '') tagJSON.imageAddress = row[4]
    if (row[5] != '') tagJSON.borderWidth = row[5]
    if (row[6] != '') tagJSON.borderColor = row[6]
    if (row[7] != '') tagJSON.backgroundColor = row[7]
    if (row[8] != '') tagJSON.textColor = row[8]
    if (row[9] != '') tagJSON.fontSize = row[9]
    if (row[10] != '') tagJSON.lineHeight = row[10]
    if (row[11] != '') tagJSON.fontName = row[11]
    if (row[12] != '') tagJSON.outlineType = row[12]
    if (row[13] != '') tagJSON.outlineColor = row[13]

    return tagJSON
}

// Converts a single container into a JSON format
function containerRowToJSON(row) {
    contJSON = {}
    contJSON.name = row[0]
    contJSON.tabPos = parseInt(row[1])
    contJSON.row = parseInt(row[2])
    contJSON.column = parseInt(row[3])
    contJSON.houses = row[4].split(';')
    contJSON.structure = {}

    return contJSON
}

// Sorts siblings into the order they should appear in on the tree.
function recursiveSiblingSort(sibA, sibB) {
    if (sibA.height != sibB.height) return sibA.height < sibB.height ? -1 : 1
    else if (!sibA.big || !sibB.big || sibA.big.name == sibB.big.name) {
        if (sibA.pledgeClassNumber != sibB.pledgeClassNumber) return sibA.pledgeClassNumber - sibB.pledgeClassNumber
        else return sibA.name < sibB.name ? -1 : 1
    }
    else return recursiveSiblingSort(sibA.big, sibB.big)
}

// Test if a sibling belongs unaltered in a container.
function belongsUnaltered(container, sib) {
    if (sib !== undefined) return container.houses.includes(sib.house)
    else return false
}

// Creates a custom widget that splits autocomplete into categories automatically
function createCatComplete() {
    $.widget( "custom.catcomplete", $.ui.autocomplete, {
        _create: function() {
            this._super()
            this.widget().menu( "option", "items", "> :not(.ui-autocomplete-category)" )
        },
        _renderMenu: function( ul, items ) {
            var that = this
            if (items.length == 0) {
                ul.append( "<li class='ui-autocomplete-category'>No results found!</li>" )
            }
            currentCategory = ""
            $.each( items, function( index, item ) {
                if ( item.category != currentCategory ) {
                    ul.append( "<li class='ui-autocomplete-category'>" + item.category + "</li>" )
                    currentCategory = item.category
                }
                li = that._renderItemData( ul, item )
                if ( item.category ) li.attr( "aria-label", item.category + " : " + item.label )
            })
        }
    })
}

// Tests a sibling to see if they belong in this search
function doesSibMatchSearch(matcher, sib) {
    switch (settings.searchType) {
        case 'name':
            return matcher.test(sib.name)
        case 'class':
            return matcher.test(sib.pledgeClass)
        case 'tag':
            found = false
            sib.tags.forEach(tagName => {
                if (matcher.test(tagName)) {
                    found = true
                    return false
                }
            })
            return found
    }
}

// Creates a search result based on search type
function buildSibSearchResult(matcher, sib) {
    result = { sibName: sib.name, link: sib }
    cleanName = unspecialText(sib.name)
    switch (settings.searchType) {
        case 'name':
            result.label = cleanName
            return result
        case 'class':
            result.label = cleanName + ' (' + sib.pledgeClass + ')'
            result.value = cleanName
            return result
        case 'tag':
            applicableTags = []
            sib.tags.forEach(tagName => {
                if (matcher.test(tagName)) applicableTags.push(tagName)
            })
            result.label = cleanName + ' (' + applicableTags.join(', ') + ')'
            result.value = cleanName
            return result
        default:
            return false
    }
}

// Turns a number of pixels into an integer
function pxToInt(pixels) {
    return parseInt(pixels.replace(/px/g, ''))
}

// Turns a pledge class's number into its corresponding unicode symbols
function pledgeClassToSymbols(pledgeClassNumber) {
    classNum = (pledgeClassNumber-1) % 24
    metaClassNum = Math.floor((pledgeClassNumber-1)/24)

    classSymbols = ["Α", "Β", "Γ", "Δ", "Ε", "Ζ", "Η", "Θ", "Ι", "Κ", "Λ", "Μ", "Ν", "Ξ", "Ο", "Π", "Ρ", "Σ", "Τ", "Υ", "Φ", "Χ", "Ψ", "Ω"]
    metaClassSymbols = ['', "δ", "ψ", "τ"]

    return classSymbols[classNum] + metaClassSymbols[metaClassNum]
}

// Takes a tag and turns it into an html image node
function createTagImage(tag) {
    tagImage = document.createElement("img")
    tagImage.src = "https://drive.google.com/thumbnail?id=" + tag.imageAddress
    tagImage.classList.add("tagSymbol")
    tagImage.classList.add("clickable")
    tagImage.classList.add(tag.iconClassName)
    tagImage.setAttribute('title', unspecialText(tag.name))
    addTagClicker(tagImage, tag)
    
    return tagImage
}

// Takes an array of tags attached to a sibling and combines them into one
function createTagConjunction(sib, tagArray) {
    conjNames = "Conjoining " + tagArray.length + " tags attached to " + sib.name + ": "
    conjNames += tagArray.map(tag => tag.name).join(", ")
    console.log(conjNames)

    newTagName = tagArray.map(tag => tag.name).join(' + ')
    if (settings.tagData.some(td => td.name == newTagName)) {
        notNewTag = getTag(newTagName)
        notNewTag.taggedSibs.push(sib)
        notNewTag.taggedSibs.sort(function(a, b) { return a.pledgeClassNumber - b.pledgeClassNumber })
        return notNewTag
    }

    newTag = {}
    newTag.name = newTagName
    newTag.className = cleanStr(newTagName)
    newTag.iconClassName = cleanStr(newTagName) + "Icon"
    newTag.type = "SYMBOL"
    newTag.taggedSibs = [sib]

    // Generate description and locate image address from constituent tags
    newDesc = ""
    currGridLev = JSON.parse(JSON.stringify(settings.conjunctionGrid))
    tagArray.forEach(tag => {
        if (newDesc != "") newDesc += '\n'
        newDesc += tag.name + ": " + tag.description
        currGridLev = currGridLev[tag.name]
    })

    // Generate related tags from constituent tags and their related tags
    tai = 0
    depth = -1
    newRelatedTags = []
    while (newRelatedTags.length < 3) {
        if (depth < 0) newRelatedTags.push(tagArray[tai].name)
        else {
            thisNewRTag = tagArray[tai].relatedTags[depth]
            if (!newRelatedTags.includes(thisNewRTag)) newRelatedTags.push(thisNewRTag)
        }

        tai++
        if (tai == tagArray.length) {
            tai = 0
            depth++
        }
    }

    newTag.description = newDesc
    newTag.relatedTags = newRelatedTags
    newTag.imageAddress = currGridLev.imageAddress ? currGridLev.imageAddress : "1WinxBtVthcMbDWOOEv3RTufurzWXCRvN"

    settings.tagData.push(newTag)

    return newTag
}

// Returns a tag's JSON
function getTag(tagName) {
    return settings.tagData.find(td => td.name == tagName)
}

// Returns the minimum value of a key in an array of JSONs.
function minValue(JSONArray, key) {
    value = JSONArray[0][key]
    while (JSONArray.some(JSON => JSON[key] < value)) value--
    return value
}

// Returns the maximum value of a key in an array of JSONs.
function maxValue(JSONArray, key) {
    value = 0
    while (JSONArray.some(JSON => JSON[key] > value)) value++
    return value
}

// Returns the value at the middle index (left bias) of an array.
function getValueAtMiddleIndex(array) {
    midIdx = Math.floor((array.length-1)/2)
    return array[midIdx]
}

// Returns the value in an array at the index one above the value given.
function nextValueOf(array, value) {
    return array[array.indexOf(value) + 1]
}

// Determines the distance of separation needed to make two siblings touch
function distToTouch(sibLeft, sibRight) {
    leftWidths = sibLeft.branchWidths
    rightWidths = sibRight.branchWidths

    // The difference in height between the two siblings
    heightDiff = sibRight.height - sibLeft.height

    // If they wouldn't touch, they can go on top of each other
    if ((heightDiff > 0 && leftWidths.length <= heightDiff)
    || (heightDiff < 0 && rightWidths.length <= -heightDiff))
        return -settings.sizes['blockMargin']

    // Loop through heights looking for the most conflicting littles
    start = Math.max(heightDiff, 0)
    end = Math.min(leftWidths.length, rightWidths.length + heightDiff)
    dist = 0
    for (j = start; j < end; j++) {
        thisDist = leftWidths[j][1] - rightWidths[j-heightDiff][0]
        dist = Math.max(dist, thisDist)
    }

    return dist
}

// Evenly spaces all littles between two "cap" littles
function evenSpacing(big, leftCap, rightCap) {
    capDiff = rightCap - leftCap
    if (capDiff == 1) {
        console.log("Something's gone horribly wrong with the evenSpacing thing")
        return
    }

    // Do a bunch of calculating
    rightestMiddleLittle = big.littles[rightCap-1]
    rightestMiddlePos = big.littleRelPos[rightCap-1]
    rightLittle = big.littles[rightCap]
    rightPos = big.littleRelPos[rightCap]
    gap = rightPos + rightLittle.branchWidths[0][0] - rightestMiddlePos - rightestMiddleLittle.branchWidths[0][1] - settings.sizes['blockMargin']

    // Evenly space them
    for (Ldx = leftCap+1; Ldx < rightCap; Ldx++) {
        marginIncrease = Math.floor(gap*(Ldx-leftCap)/capDiff)
        big.littleRelPos[Ldx] += marginIncrease
    }

    console.log("Making " + big.name + "'s littles more evenly spaced!")
}

// Stores the corrected relative positions and hitboxes of a sib's descendants.
function calculateRelativePositions(container, sib) {
    thisBlock = sib.div
    thisW = $( thisBlock ).width()
    thisW = Math.ceil(thisW)
    $( thisBlock ).width(thisW)

    buttonWidth = Math.ceil(pxToInt( $( thisBlock ).find( "button" ).css("width") ))
    lineWeight = settings.sizes['lineWeight']
    leftHang = Math.min(thisW/2, buttonWidth - lineWeight/2)
    rightHang = Math.max(thisW/2, thisW - buttonWidth + lineWeight/2)

    hangDiff = thisW/2 - leftHang
    $( thisBlock ).find( ".line.vert" ).css('right', hangDiff)

    sib.width = thisW
    sib.branchWidths = [[-leftHang, rightHang]]
    sib.littleRelPos = [0]

    // If has no littles, return, else do recursion
    if (sib.littles.length == 0) return
    else sib.littles.forEach(little => calculateRelativePositions(container, little))

    // Do simple case of one little
    if (sib.littles.length == 1) {
        little = sib.littles[0]
        sib.branchWidths = sib.branchWidths.concat(little.branchWidths)
        return
    }

    // FOR MULTIPLE LITTLES:
    // Loop through other littles and determine the necessary distance from each previous other little
    sib.littles.forEach(function(little, idx) {
        if (idx == 0) return

        pos = 0
        limiter = idx-1
        for (jdx = idx-1; jdx >= 0; jdx--) {
            testLittle = sib.littles[jdx]
            thisPos = Math.floor(sib.littleRelPos[jdx] + distToTouch(testLittle, little) + settings.sizes['blockMargin'])

            // This little is indeed pushed back by a prior little
            if (thisPos > pos) {
                pos = thisPos
                limiter = jdx
            }
        }

        sib.littleRelPos.push(pos)

        // If it can, evenly space littles that have wiggle room
        if (limiter < idx-1) {
            evenSpacing(sib, limiter, idx)
        }
    })

    // Adjust to make big in the center
    rightestPos = sib.littleRelPos[sib.littleRelPos.length-1]
    sib.littleRelPos.forEach(function(val, vdx) {
        sib.littleRelPos[vdx] = val - Math.floor(rightestPos/2)
    })

    // Adjust slightly for ocd if littles are close enough to make a straight line
    adj = 0
    sib.littleRelPos.forEach(function(val, vdx) {
        if (Math.abs(val) < 10) {
            adj = -val
            if (adj != 0) console.log("Adjusting " + sib.name +"'s littles by " + val + " for OCD reasons!")
            return false
        }
    })
    sib.littleRelPos.forEach(function(val, vdx) {
        sib.littleRelPos[vdx] = val + adj
    })

    // Determine the deepest this rabbit hole goes
    longestLength = 0
    sib.littles.forEach(little => longestLength = Math.max(longestLength, little.branchWidths.length))

    // Add littles' hitboxes
    leftIdx = 0
    rightIdx = sib.littles.length-1
    for (i = 0; i < longestLength; i++) {
        // Find the leftest little with a descendent of this height and get how far left it is
        leftLittle = sib.littles[leftIdx]
        while (leftLittle.branchWidths.length <= i) {
            leftIdx++
            leftLittle = sib.littles[leftIdx]
        }
        leftWidth = leftLittle.branchWidths[i][0] + sib.littleRelPos[leftIdx]

        // Find the rightest little with a descendent of this height and get how far right it is
        rightLittle = sib.littles[rightIdx]
        while (rightLittle.branchWidths.length <= i) {
            rightIdx--
            rightLittle = sib.littles[rightIdx]
        }
        rightWidth = rightLittle.branchWidths[i][1] + sib.littleRelPos[rightIdx]

        // Append that to the sib's widths
        sib.branchWidths.push([leftWidth, rightWidth])
    }
}

// Sets littles' absolute positions recursively
function setLittleAbsolutePositions(container, sib) {
    sib.littles.forEach(function(little, idx) {
        relPos = sib.littleRelPos[idx]

        little.position = Math.floor(sib.position + relPos)
        setLittleAbsolutePositions(container, little)
    })
}

// Sets the position that the container will be focused on
function setScrollLock(container) {
    thisTreeContainer = container.containerDiv
    slx = thisTreeContainer.scrollLeft + thisTreeContainer.clientWidth/2
    container.scrollLock = [slx, thisTreeContainer.scrollTop]
}

// Scrolls a container to the position it should be locked at
function goToScrollLock(container) {
    thisTreeContainer = container.containerDiv
    stx = container.scrollLock[0] - thisTreeContainer.clientWidth/2
    thisTreeContainer.scrollTo(stx, container.scrollLock[1])
}

// Gets the clickable element pertaining to the tab that a sibling is in
function containeredSibTabClickable(sib) {
    return sib.container.structure.tabsTab.firstChild
}

// Parses siblings data into relevant tab data
function sibToTab(sib) {
    tabData = {
        tabType: "nameTab",
        sib: sib,
        ele: sib.div
    }
    return tabData
}

// Parses the name of a sibling with ambiguous origin to relevant tab data
function containerlessSibToTab(sibName) {
    sib = siblings.find(sib => sib.name == sibName)
    tabData = {
        tabType: "nameTab",
        sib: sib
    }
    return tabData
}

// Parses tag data into relevant tab data
function tagToTab(tag) {
    tabData = {
        tabType: "tagTab",
        tag: tag,
        name: tag.name,
        imgSrc: tag.imageAddress ? "https://drive.google.com/thumbnail?id=" + tag.imageAddress : undefined
    }
    return tabData
}

// Changes tab displayed alongside tree, or only the tree itself.
function showTab(tabData) {
    containers.forEach(cont => setScrollLock(cont))

    // Turns tree display and info display into a Split with a gutter for resizing
    if (!appElement.split) {
        appElement.split = Split(['#leftColContainer', '#rightColContainer'], {
            gutterSize: 12,
            sizes: [80, 20],
            minSize: 300,
            onDragStart: function (sizes) {
                containers.forEach(cont => setScrollLock(cont))
            },
            onDrag: function (sizes) {
                containers.forEach(cont => goToScrollLock(cont))
            },
        })
    }

    // Adds tab info to tab history
    appElement.tabHistory = appElement.tabHistory.slice(0, appElement.tabPosition+1)
    appElement.tabHistory.push(tabData)
    appElement.tabPosition++

    // Removes 'active' class from previously selected ele
    $( ".active" ).removeClass("active")
    if (tabData.tabType == 'tagTab') $( "." + tabData.tag.iconClassName ).addClass("active")

    // Scroll to the correct spot and add 'active' class to new ele
    setTimeout(function() {
        containers.forEach(cont => goToScrollLock(cont))
        if (tabData.ele) {
            snap = false
            if (tabData.sib) {
                sibTab = containeredSibTabClickable(tabData.sib)
                if (!sibTab.parentNode.classList.contains('ui-state-active')) snap = true
                $( sibTab ).click()
            }
            if (snap) tabData.ele.scrollIntoView({behavior: "auto", block: "center", inline: "center"})
            else tabData.ele.scrollIntoView({behavior: "smooth", block: "center", inline: "center"})
            tabData.ele.classList.add("active")
        }
    }, 0)
}

// Goes back one tab in the tab nav
function goBack() {
    if (appElement.tabPosition == 1) exitTab()
    else {
        appElement.tabPosition--
        if (appElement.getTabData().ele) {
            setTimeout(function() {
                appElement.getTabData().ele.scrollIntoView({behavior: "smooth", block: "center", inline: "center"})
            }, 0)
        }
    }
}
// Goes forward one tab in the tab nav
function goForward() {
    appElement.tabPosition++
    if (appElement.getTabData().ele) {
        setTimeout(function() {
            appElement.getTabData().ele.scrollIntoView({behavior: "smooth", block: "center", inline: "center"})
        }, 0)
    }
}

// Goes back to tree
function exitTab() {
    containers.forEach(cont => setScrollLock(cont))

    appElement.tabHistory = [{ tabType: 'tree' }]
    appElement.tabPosition = 0
    if (appElement.split) {
        appElement.split.destroy()
        appElement.split = null
    }

    setTimeout(function() {
        containers.forEach(cont => goToScrollLock(cont))
    }, 0)
}

// Saves the current tree as an svg and tries to download it
// function saveCurrentTree() {
//     tcc = document.querySelector("#tabsContainerContainer")
//     treeToCapture = $( "#container-tab-" + $( tcc ).tabs( "option", "active" ) + " .treeContainer" )

//     html2canvas(treeToCapture)
// }

function saveCurrentTree() {
    // Get the tabs container and find the active tab
    let tcc = document.querySelector("#tabsContainerContainer");
    let activeTabIndex = $(tcc).tabs("option", "active"); // Get the index of the active tab
    let treeToCapture = $("#container-tab-" + activeTabIndex + " .treeContainer");

    html2canvas(treeToCapture[0]).then(canvas => {
        document.body.appendChild(canvas)
    });


    // Use html2canvas to capture the content
    // html2canvas(treeToCapture[0]).then((canvas) => {
    //     document.body.appendChild(canvas)
    //     // Create a temporary link to trigger the download
    //     let link = document.createElement("a");
    //     link.href = dataUrl;
    //     link.download = "current_tree.png"; // Default file name

    //     // Programmatically click the link to trigger the download
    //     link.click();
    // }).catch((error) => {
    //     console.error("Error capturing the tree:", error);
    // });
}