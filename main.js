// It's main!
function main() {
    applySettings()
    createAllContainerDivs()
    createMenu()
    exitTab()

    // // Loops through every container and builds individual trees for each
    // containers.forEach(container => {
    //     copySiblingSet(container)
    //     createUnspacedTree(container)
    //     // Arbitrarily long timer to ensure everything loads properly, 3s is likely overkill
    //     setTimeout(function(){
    //         spaceTree(container)
    //         drawAcrossLines(container)
    //         makeDraggable(container.containerDiv)
    //     }, 3000)
    // })

    //Jiah Fix

    containers.forEach(container => {
        copySiblingSet(container)
        createUnspacedTree(container)
        setTimeout(function(){
            // Temporarily expand this tab so getBoundingClientRect()
            // returns real measurements instead of zeros
            let tabDiv = container.structure['tabs']
            let savedHeight   = tabDiv.style.height
            let savedOverflow = tabDiv.style.overflow
            let savedDisplay  = tabDiv.style.display
            tabDiv.style.height   = '2000px'
            tabDiv.style.overflow = 'visible'
            tabDiv.style.display  = 'block'
    
            spaceTree(container)
            drawAcrossLines(container)
            createHouseLogos(container)
            createHouseBackground(container)
            makeDraggable(container.containerDiv)
    
            // Restore original state
            tabDiv.style.height   = savedHeight
            tabDiv.style.overflow = savedOverflow
            tabDiv.style.display  = savedDisplay
        }, 3000)
    })
}

// Apply settings JSON to stylesheet and other places
function applySettings() {
    console.log(`Applying settings...`)

    // Size settings
    $.each(settings.sizes, function(prop, val) {
        document.body.style.setProperty('--' + prop, val + 'px')
    })

    // Tag data
    stylesheet = document.styleSheets[0]
    settings.tagData.forEach(tag => {
        if (tag.type.includes("STYLE")) {
            rule = "." + cleanStr(tag.name) + " {\n"
            if (tag.borderWidth) {
                rule += "border-width: " + tag.borderWidth + "px;\n"
                rule += "outline-offset: -" + tag.borderWidth + "px;\n"
                rule += "outline-width: -" + tag.borderWidth + "px;\n"
            }
            if (tag.borderColor) rule += "border-color: " + tag.borderColor + ";\n"
            if (tag.backgroundColor) rule += "background-color: " + tag.backgroundColor + ";\n"
            if (tag.textColor) rule += "color: " + tag.textColor + ";\n"
            if (tag.fontSize) rule += "font-size: " + tag.fontSize + "px;\n"
            if (tag.lineHeight) rule += "line-height: " + tag.lineHeight + "px;\n"
            if (tag.fontName) rule += "font-family: " + tag.fontName + ";\n"
            if (tag.outlineType) rule += "outline-style: " + tag.outlineType + ";\n"
            if (tag.outlineColor) rule += "outline-color: " + tag.outlineColor + ";\n"
            rule += "}"

            stylesheet.insertRule(rule, stylesheet.cssRules.length)
        }
        if (tag.type.includes("HOUSE")) {
            rule = "." + cleanStr(tag.name) + ".line {\n"
            rule += "background-color: " + tag.borderColor + ";\n"
            rule += "}"

            stylesheet.insertRule(rule, stylesheet.cssRules.length)

            rule = "." + cleanStr(tag.name) + ".stub {\n"
            rule += "background-color: " + tag.borderColor + ";\n"
            rule += "}"

            stylesheet.insertRule(rule, stylesheet.cssRules.length)
        }
    })
}

// Create all the elements necessary to display the tree in every way
function createAllContainerDivs() {
    console.log(`Creating all container divs...`)
    createLocalContainerDivs()
    createMWContainerDivs()
    createTabContainerDivs()
    addLocalDivsToStructure()
}

// Create the local elements to hold the trees
function createLocalContainerDivs() {
    containers.forEach(container => {
        // Create container div
        treeContainerDiv = document.createElement('div')
        treeContainerDiv.id = "tree-container-" + cleanStr(container.name)
        treeContainerDiv.classList.add('treeContainer')

        treeDiv = document.createElement('div')
        treeDiv.classList.add('tree')
        treeContainerDiv.appendChild(treeDiv)

        container.containerDiv = treeContainerDiv
        container.treeDiv = treeDiv
    })

    window.onresize = onResizeEvent
}

// Create a whole fuck ton of nested divs to hold all the trees for multi-window
function createMWContainerDivs() {
    containerSplits = {
        horizSplits: [],
        vertSplit: null
    }
    crc = document.querySelector('#mwContainerContainer')
    containerRows = maxValue(containers, 'row') + 1
    cRowIDList = []
    for (i = 0; i < containerRows; i++) {
        containerRow = document.createElement('div')
        containerRow.id = "container-row-" + i
        containerRow.classList.add("container")
        containerRow.classList.add("row")
        crc.append(containerRow)
        cRowIDList.push('#' + containerRow.id)

        thisRowContents = containers.filter(cont => cont.row == i)
        cColIDList = []
        for (j = 0; j < thisRowContents.length; j++) {
            containerColumn = document.createElement('div')
            containerColumn.id = "container-column-" + i + "-" + j
            containerColumn.classList.add("container")
            containerColumn.classList.add("column")
            containerRow.append(containerColumn)
            cColIDList.push('#' + containerColumn.id)

            thisContainer = containers.find(cont => cont.row == i && cont.column == j)
            thisContainer.structure['multi-window'] = containerColumn
        }

        // Create a split between all elements in this row that keeps the content in the center in the center
        thisRowSplit = Split(cColIDList, {
            snapOffset: 0,
            onDragStart: function (sizes) {
                thisRowContents.forEach(cont => setScrollLock(cont))
            },
            onDrag: function (sizes) {
                thisRowContents.forEach(cont => goToScrollLock(cont))
            },
        })
        containerSplits.horizSplits.push(thisRowSplit)
    }
    // Creates a split between all the rows
    colSplit = Split(cRowIDList, {
        direction: 'vertical',
        cursor: 'row-resize',
        snapOffset: 0,
    })
    containerSplits.vertSplit = colSplit
}

// Create all the containers for the tabs
function createTabContainerDivs() {
    tcc = document.querySelector("#tabsContainerContainer")
    tbcW = document.querySelector("#tbcWrapper")
    tbc = document.querySelector("#tabButtonsContainer")
    containers.forEach(container => {
        containerDiv = document.createElement('div')
        containerDiv.id = "container-tab-" + container.tabPos
        containerDiv.classList.add("containerTab")
        tcc.insertBefore(containerDiv, tbcW)

        sliderContainer = document.createElement('div')
        sliderContainer.classList.add('zoom-container')
        containerDiv.appendChild(sliderContainer)

        zoomSlider = document.createElement('div')
        zoomSlider.classList.add('zoom-slider')
        sliderContainer.appendChild(zoomSlider)

        $( zoomSlider ).slider({
            orientation: "vertical",
            min: 0.1,
            max: 2,
            step: 0.1,
            value: 1,
            slide: function( event, ui ) {
                trueVal = ui.value
                $( this ).parent().parent().find( '.tree' ).css("transform", "scale(" + trueVal + ")")
                $( this ).parent().parent().css('height', '99%')
                $( this ).parent().parent().css('height', '100%')
            }
        })

        tabButton = document.createElement('li')
        tabButton.classList.add("tabForContainer")
        tbc.append(tabButton)

        tabLink = document.createElement('a')
        tabLink.setAttribute('href', '#' + containerDiv.id)
        tabLink.setAttribute('data-href', '#' + containerDiv.id)
        tabButton.appendChild(tabLink)

        nameName = document.createTextNode(container.name)
        tabLink.appendChild(nameName)

        container.structure['tabs'] = containerDiv
        container.structure['tabsTab'] = tabButton
    })
    tabs = $( tcc ).tabs({
        classes: {
            "ui-tabs-nav": "",
            "ui-tabs-tab": "ui-corner-all"
        },
        create: function(e, ui) {
            anchors = $( tcc ).find( ".ui-tabs-anchor" )
            anchors.removeAttr('href')

            panels = $( tcc ).find( ".ui-tabs-panel" )
            panels.removeAttr('aria-hidden')
            panels.css("display", "")
            ui.panel.height('100%')

            $( ".zoom-container" ).css('display', 'none')
            ui.panel.find( ".zoom-container" ).css('display', 'initial')
        },
        beforeActivate: function(e, ui) {
            thisLink = $( ui.newTab ).children()
            href = thisLink.attr('data-href')
            thisLink.attr('href', href)
        },
        activate: function(e, ui) {
            panels = $( tcc ).find( ".ui-tabs-panel" )
            panels.removeAttr('aria-hidden')
            panels.css("display", "")
            ui.oldPanel.height('0%')
            ui.newPanel.height('100%')

            ui.oldPanel.find( ".zoom-container" ).css('display', 'none')
            ui.newPanel.find( ".zoom-container" ).css('display', 'initial')

            thisLink = $( ui.newTab ).children()
            thisLink.removeAttr('href')
        }
    })
    tabs.find( ".ui-tabs-nav" ).sortable({
        axis: "x",
        containment: "parent",
        items: "> .tabForContainer",
        revert: true,
        start: function(e, ui) {
            // Jank to make displaced tabs have the right height
            if ($( tbc ).get(0).scrollWidth > $( tbc ).innerWidth()) {
                ui.item.css("top", `calc(100% - 62px)`)
            }
            else ui.item.css("top", `calc(100% - 45px)`)
        },
        stop: function(e, ui) {
            ui.item.css("top", "")

            $( '[data-href]' ).each((idx, el) => {
                el.setAttribute('href', el.getAttribute('data-href'))
            })
            tabs.tabs( "refresh" )
            $( '[data-href]' ).removeAttr('href')
        }
    })
}

// Adds container divs to structure
function addLocalDivsToStructure() {
    containers.forEach(cont => {
        if (cont.containerDiv.parentNode) cont.containerDiv.parentNode.removeChild(cont.containerDiv)
        cont.structure[settings.containerStyle].appendChild(cont.containerDiv)
    })
}

// Gives the menu items functionality
function createMenu() {
    // Applies tooltips to all elements with the title attribute
    $( document ).tooltip({
        position: {my: "center top", at: "center bottom+15"}
    })

    // Creates controlgroups for all controlgroups
    $( '.controlgroup' ).controlgroup()

    // Create menu for choosing search type
    $( '#searchTypeSelect' ).selectmenu({
        classes: {
            "ui-selectmenu-button": "ui-button-icon-only"
        },
        create: function(e, ui) {
            $( "#searchTypeSelect-button" ).prop('title', 'Search by name')
            $( "#searchTypeSelect-button" ).tooltip({
                position: {my: "center top", at: "center bottom+15"}
            })
        },
        open: function(e, ui) {
            $( "#searchTypeSelect-button" ).tooltip('disable')
        },
        select: function(e, ui) {
            ele = $( ui.item.element )
            settings.searchType = ele.attr('type')
            setTimeout(function(){
                $( "#searchTypeSelect-button" ).prop('title', ele.text())
                $( "#searchInput" ).prop('placeholder', `${ele.text()}...`)
            }, 100)
        },
        close: function(e, ui) {
            $( "#searchTypeSelect-button" ).tooltip('enable')
        },
    })

    // Creates the autocomplete/search element
    createCatComplete()
    $( "#searchInput" ).catcomplete({
        delay: 0,
        source: function(request, response) {
            matcher = new RegExp( $.ui.autocomplete.escapeRegex( request.term ), "i" )
            dataSet = []
            containers.forEach(cont => {
                cont.siblings.filter(sib => doesSibMatchSearch(matcher, sib)).forEach(sib => {
                    result = buildSibSearchResult(matcher, sib)
                    result.category = cont.name
                    dataSet.push(result)
                })
            })
            siblings.filter(sib => !dataSet.some(dat => dat.sibName == sib.name) && doesSibMatchSearch(matcher, sib)).forEach(sib => {
                result = buildSibSearchResult(matcher, sib)
                result.category = "Other Siblings"
                dataSet.push(result)
            })

            if (settings.searchType == 'name' || settings.searchType == 'tag') {
                settings.tagData.filter(tag => matcher.test(tag.name)).forEach(tag => {
                    dataSet.push({
                        label: unspecialText(tag.name),
                        category: "Tags",
                        link: tag
                    })
                })
            }
            
            response(dataSet)
        },
        select: function(e, ui) {
            switch (ui.item.category) {
                case 'Other Siblings':
                    tabData = containerlessSibToTab(ui.item.link)
                    break
                case 'Tags':
                    tabData = tagToTab(ui.item.link)
                    break
                default:
                    tabData = sibToTab(ui.item.link)
                    break
            }

            showTab(tabData)
        }
    })
}

// Copies and edits the set of siblings to a container
function copySiblingSet(container) {
    console.log(`Copying the sibling set for container ${container.name}...`)

    // Edits siblings into stubs if necessary
    container.siblings = siblings.filter(sib => {
        belongs = belongsUnaltered(container, sib)
        if (sib.big && belongsUnaltered(container, sib.big)) belongs = true
        sib.littles.forEach(little => {
            if (belongsUnaltered(container, little)) belongs = true
        })
        return belongs
    }).map(sib => {
        validLittleNames = []
        sib.littles.forEach(little => {
            if (belongsUnaltered(container, little)) validLittleNames.push(little.name)
        })

        if (belongsUnaltered(container, sib)) {
            sibJSON = {
                name: sib.name,
                littles: [],
                pledgeClass: sib.pledgeClass,
                pledgeClassNumber: sib.pledgeClassNumber,
                gradYear: sib.gradYear,
                house: sib.house,
                tags: sib.tags,
                otherselvesNames: sib.otherselvesNames,
                height: sib.height,
                container: container
            }
            if (belongsUnaltered(container, sib.big)) sibJSON.bigName = sib.bigName

            return sibJSON
        }
        else {
            stubJSON = {
                name: sib.house,
                littles: [],
                house: sib.house,
                tags: ['stub'],
                otherselvesNames: [],
                height: sib.height,
                container: container
            }
            if (belongsUnaltered(container, sib.big)) stubJSON.bigName = sib.bigName
            if (validLittleNames.length > 0) stubJSON.littleNames = validLittleNames

            return stubJSON
        }
    })

    // Link all siblings in big/little heirarchy (plus otherselves)
    container.siblings.forEach(sib => {
        if (sib.bigName) {
            sib.big = container.siblings.find(sibling => sibling.name == sib.bigName)
            sib.big.littles.push(sib)
        }

        sib.otherselves = []
        if (!sib.otherselvesNames) console.log(`${sib.name} has broken otherselves: ${sib.otherselvesNames}`)
        sib.otherselvesNames.forEach(otherselfName => {
            if (container.siblings.includes(sib => sib.name == otherselfName)) {
                otherself = container.siblings.find(sib => sib.name == otherselfName)
                sib.otherselves.push(otherself)
            }
        })

        if (sib.littleNames) {
            sib.littleNames.forEach(littleName => {
                little = container.siblings.find(sibling => sibling.name == littleName)
                sib.littles.push(little)
                little.big = sib
            })
        }
    })

    container.siblings.sort(recursiveSiblingSort)
}

// Places all blocks roughly down, in the right order but not correctly positioned
function createUnspacedTree(container) {
    console.log(`Creating the unspaced tree for ${container.name}...`)
    treeDiv = container.treeDiv

    // Loop through the rows
    minSibHeight = minValue(container.siblings, 'height')
    maxSibHeight = maxValue(container.siblings, 'height')
    for (i = minSibHeight; i <= maxSibHeight; i++) {
        // Create the row element where all of the blocks and spaces will be stored
        row = document.createElement('div')
        row.id = 'row-' + i
        row.classList.add('row')
        treeDiv.append(row)

        // Loop through the siblings in this row
        thisHeightSibs = container.siblings.filter(sib => sib.height == i)
        thisHeightSibs.forEach(sib => {
            // Create a block where all the stuff for an individual sibling is held
            block = document.createElement('div')
            block.classList.add('block')
            block.id = cleanStr(sib.name)
            row.append(block)

            sib.div = block

            // Get a class name from the sib's house
            houseClean = cleanStr(sib.house)

            // Add a line above the nas which is transparent if there should not be a line there
            topLine = document.createElement('div')
            topLine.classList.add('line')
            topLine.classList.add('vert')

            if (sib.big) topLine.classList.add(cleanStr(sib.big.house))
            else topLine.classList.add("transparent")

            block.append(topLine)

            // The nas (name and symbols), which contains the sib's name and all the symbols attached to them
            nas = document.createElement('div')
            nas.classList.add('nameAndSymbols')
            block.append(nas)

            // The name button, a button with the sib's name on it
            nameButton = document.createElement("BUTTON")
            nameButton.classList.add('name')
            nameButton.classList.add('clickable')
            nameButton.classList.add(houseClean)

            // If stub. should redirect to house info. Otherwise, redirects to sibling.
            if (sib.tags.includes('stub')) {
                tag = getTag(sib.house)
                addTagClicker(nameButton, tag)
            } else addNameClicker(nameButton, sib)
            nas.append(nameButton)

            // Apply tags to nas
            toPotentiallyConjunct = []
            conjunction = []
            sib.tags.forEach(tagName => {
                tag = getTag(tagName)

                // Apply tags to classes for formatting
                nameButton.classList.add(cleanStr(tagName))
                    
                // If it's a symbol, add the symbol
                if (tag.type.includes("SYMBOL")) {
                    tagImage = createTagImage(tag)
                    nas.appendChild(tagImage)

                    // Register conjunction of conjunctable tags
                    if (tag.type.includes("CONJ")) {
                        toPotentiallyConjunct.push(tagImage)
                        conjunction.push(tag)

                        // If this is the last to be conjuncted, do the conjoining!
                        if (sib.tags.indexOf(tagName) == sib.tags.length - 1 ||
                            !getTag(nextValueOf(sib.tags, tagName)).type.includes("CONJ")) {

                            if (conjunction.length > 1) {
                                toPotentiallyConjunct.forEach(forsakenChild => nas.removeChild(forsakenChild))
                                conjunctionImage = createTagImage(createTagConjunction(sib, conjunction))
                                nas.appendChild(conjunctionImage)
                            }

                            toPotentiallyConjunct = []
                            conjunction = []
                        }
                    }
                }
                // If it's an image background, add the image to the background
                if (tag.type.includes("IMGBACKGROUND")) {
                    nameButton.style.backgroundImage = 'url("https://drive.google.com/thumbnail?id=' + tag.imageAddress + '")'
                    nameButton.style.backgroundRepeat = "repeat-x"
                    nameButton.style.backgroundSize = "contain"
                }
                // If it's special, do whatever crazy bullshit
                if (tag.type.includes("SPECIAL")) {
                    if (tag.name == "Dropped" || tag.name == "Moved") {
                        buttonStyle = window.getComputedStyle(nameButton)
                        backgroundCol = buttonStyle.backgroundColor
                        borderCol = buttonStyle.borderColor
                        struckThroughString = "linear-gradient(0deg, " + backgroundCol + " 45%, " + borderCol + " 45%, " + borderCol + " 55%, " + backgroundCol + " 55%)"
                        nameButton.style.background = struckThroughString
                    }
                }
            })


            // The name itself
            if (sib.tags.includes('stub')) {
                nameNameName = filterInvisText(sib.house)
                nameName = document.createTextNode(nameNameName)
                nameButton.appendChild(nameName)
            }
            else {
                nameNameName = filterInvisText(sib.name)
                nameName = document.createTextNode(nameNameName)
                nameButton.appendChild(nameName)

                pledgeClassText = document.createTextNode(' ' + pledgeClassToSymbols(sib.pledgeClassNumber))
                pledgeClassNode = document.createElement('A')
                pledgeClassNode.appendChild(pledgeClassText)
                nameButton.appendChild(pledgeClassNode)
            }

            

            // If the sib has any littles, add a line below the nas, else make it transparent
            botLine = document.createElement('div')
            botLine.classList.add('line')
            botLine.classList.add('vert')

            if (sib.littles.length > 0) botLine.classList.add(houseClean)
            else botLine.classList.add("transparent")

            block.append(botLine)
        })
    }
}

// Spaces the tree correctly
function spaceTree(container) {
    console.log(`Spacing the tree for container ${container.name}...`)
    treeDiv = container.treeDiv

    prevEnd = 0
    blockMargin = settings.sizes['blockMargin']
    treeMarginLeft = settings.sizes['treeMarginLeft']

    biglessSibs = container.siblings.filter(thisSib => !thisSib.big)
    biglessSibs.forEach(sib => {
        calculateRelativePositions(container, sib)

        // Put siblings at the top in the correct position*
        position = 0
        biglessSibs.every(prevSib => {
            if (prevSib.name == sib.name) {
                position = Math.max(sib.branchWidths[0][0] + blockMargin, position)
                return false
            }
            else position = Math.max(prevSib.position + distToTouch(prevSib, sib) + blockMargin, position)
            return true
        })
        sib.position = Math.floor(position)

        // *Prevent boxes from going negative
        sib.branchWidths.forEach((widths, height) => {
            if (widths[0] + sib.position < blockMargin) sib.position = blockMargin - Math.floor(widths[0])
        })

        setLittleAbsolutePositions(container, sib)
    })

    // Calculate all the margins
    minSibHeight = minValue(container.siblings, 'height')
    maxSibHeight = maxValue(container.siblings, 'height')
    for (i = minSibHeight ; i <= maxSibHeight; i++) {
        prevEnd = 0
        thisRowSibs = container.siblings.filter(thisSib => thisSib.height == i)
        thisRowSibs.forEach(sib => {
            space = sib.position - prevEnd + sib.branchWidths[0][0]

            sibBlock = sib.div
            sibBlock.style.marginLeft = space + "px"

            //prevEnd = sibBlock.getBoundingClientRect().right - container.containerDiv.getBoundingClientRect().left - treeMarginLeft
            
            //Jiah
            prevEnd = sib.position + sib.branchWidths[0][1]
        })
    }

    // Make left margin auto
    $( treeDiv ).css('margin-left', 'auto')

    centerTopSib = getValueAtMiddleIndex(biglessSibs)
    centerTopSib.div.scrollIntoView({behavior: "auto", block: "start", inline: "center"})
    container.containerDiv.scrollTop = 0
    console.log(`With spacing, container ${container.name} has these siblings:`)
    console.log(container.siblings)
}



// Draws the lines that connect littles across to their big
function drawAcrossLines(container) {
    console.log(`Drawing across lines for container ${container.name}...`)
    treeDiv = container.treeDiv

    lineWeight = settings.sizes['lineWeight']

    minSibHeight = minValue(container.siblings, 'height')
    maxSibHeight = maxValue(container.siblings, 'height')
    for (height = minSibHeight; height < maxSibHeight; height++) {
        prevEnd = 0

        divRow = treeDiv.querySelector('#row-' + height)
        divAcross = document.createElement("div")
        divAcross.id = "across-" + height
        divAcross.classList.add("across")
        treeDiv.insertBefore(divAcross, divRow.nextSibling)

        thisRowSibs = container.siblings.filter(thisSib => thisSib.height == height)
        thisRowSibs.forEach(sib => {
            if (sib.littles.length == 1) {
                little = sib.littles[0]

                leftSpace = little.position - prevEnd - lineWeight/2
                lineWidth = lineWeight
            }
            else if (sib.littles.length > 1) {
                firstLittle = sib.littles[0]
                lastLittle = sib.littles[sib.littles.length-1]

                leftSpace = firstLittle.position - prevEnd - lineWeight/2
                lineWidth = lastLittle.position - firstLittle.position + lineWeight
            }
            else return

            acrossLine = document.createElement("div")
            acrossLine.classList.add("line")
            acrossLine.classList.add("horiz")
            acrossLine.classList.add(cleanStr(sib.house))
            acrossLine.style.marginLeft = leftSpace + "px"
            acrossLine.style.width = lineWidth.toFixed(0) + "px"

            divAcross.appendChild(acrossLine)

            prevEnd += leftSpace + lineWidth
        })
    }
}

/**
 * By Jiah and Claude
 * 
 * Welp, I got this to work at last but it comes with some issues
 * 
 * The main bug I've found is that if you zoom out while its still loading if fucks up
 * the placements of the icons, otherwise it works great and should be future proof when more icons
 * come into play
 *  
 */
function createHouseLogos(container) {
    let taggedHouses = container.houses.map(h => getTag(h)).filter(t => t && t.imageAddress)
    if (taggedHouses.length <= 5) return Promise.resolve()
    let blockHeight = settings.sizes['blockHeight']
    let lineWeight  = settings.sizes['lineWeight']
    let rowSpacing  = blockHeight + lineWeight
    let pad = 15

    let sibBoxes = container.siblings.map(sib => {
        let btn = sib.div ? sib.div.querySelector('button') : null
        let nas = sib.div ? sib.div.querySelector('.nameAndSymbols') : null
        let btnW = btn ? btn.offsetWidth : 80
        let nasW = nas ? nas.offsetWidth : btnW
        let btnLeft = sib.position - btnW / 2
        return {
            left:   btnLeft - pad,
            right:  btnLeft + nasW + pad,
            top:    sib.height * rowSpacing - pad,
            bottom: sib.height * rowSpacing + blockHeight + pad
        }
    })

    let treeDivRect = container.treeDiv.getBoundingClientRect()
    container.treeDiv.querySelectorAll('.line:not(.transparent)').forEach(lineEl => {
        let r = lineEl.getBoundingClientRect()
        if (r.width === 0 && r.height === 0) return
        sibBoxes.push({
            left:   r.left   - treeDivRect.left - pad,
            right:  r.right  - treeDivRect.left + pad,
            top:    r.top    - treeDivRect.top  - pad,
            bottom: r.bottom - treeDivRect.top  + pad
        })
    })

    let placedLogos = []

    function overlapsAny(gx, gy, gw, gh) {
        let gx2 = gx + gw, gy2 = gy + gh
        for (let b of sibBoxes)    { if (gx < b.right && gx2 > b.left && gy < b.bottom && gy2 > b.top) return true }
        for (let b of placedLogos) { if (gx < b.right && gx2 > b.left && gy < b.bottom && gy2 > b.top) return true }
        return false
    }

    // Search top-first within a Y band, clamp X >= 10 to avoid screen clip
    function findInBand(anchorX, bandTop, bandBottom, logoW, logoH, searchRadius) {
        let step = 8
        let candidates = []
        for (let gy = bandTop; gy <= bandBottom; gy += step) {
            for (let gx = Math.max(10, anchorX - searchRadius); gx <= anchorX + searchRadius; gx += step) {
                candidates.push({ gx, gy, dx: Math.abs((gx + logoW/2) - anchorX) })
            }
        }
        // Top-first, then closest to anchor center
        candidates.sort((a, b) => a.gy !== b.gy ? a.gy - b.gy : a.dx - b.dx)
        for (let c of candidates) {
            if (!overlapsAny(c.gx, c.gy, logoW, logoH)) return { x: c.gx, y: c.gy }
        }
        return null
    }

    let houseTags = settings.tagData.filter(t => t.type.includes('HOUSE') && t.imageAddress)
    houseTags.sort((a, b) => {
        let aC = container.siblings.filter(s => s.house === a.name && !s.tags.includes('stub')).length
        let bC = container.siblings.filter(s => s.house === b.name && !s.tags.includes('stub')).length
        return bC - aC
    })

    let imageRatios = {}
    let loadPromises = houseTags.map(tag => new Promise(resolve => {
        let img = new Image()
        img.onload  = () => { imageRatios[tag.name] = img.naturalWidth / img.naturalHeight; resolve() }
        img.onerror = () => { imageRatios[tag.name] = 1; resolve() }
        img.src = tag.imageAddress
    }))

    Promise.all(loadPromises).then(() => {
        houseTags.forEach(tag => {
            let houseSibs = container.siblings.filter(s => s.house === tag.name && !s.tags.includes('stub'))
            if (houseSibs.length === 0) return

            let memberCount = houseSibs.length
            let ratio = imageRatios[tag.name] || 1
            let baseW = Math.min(700, Math.max(220, Math.sqrt(memberCount) * 65))

            let minH = Math.min(...houseSibs.map(s => s.height))
            let maxH = Math.max(...houseSibs.map(s => s.height))
            let topY    = Math.max(5, minH * rowSpacing)
            let bottomY = maxH * rowSpacing + blockHeight

            let anchorX = houseSibs.reduce((s, m) => s + m.position, 0) / houseSibs.length
            let searchRadius = Math.max(baseW * 2, (bottomY - topY) * 0.5 + baseW)

            // Band top: 2 rows above clan heads so logo can sit just above them
            let bandTop = Math.max(10, topY - rowSpacing * 2)

            const sizeFactors = [1.0, 0.85, 0.7, 0.58, 0.46, 0.36, 0.27, 0.2]
            let placed = false

            for (let f of sizeFactors) {
                let logoW = Math.max(60, Math.floor(baseW * f))
                let logoH = Math.max(40, Math.round(logoW / ratio))

                // PASS 1: strict top band — only search top 5 rows of the house
                // This forces logos to stay near clan heads, never drift to bottom
                let strictBottom = Math.min(bandTop + rowSpacing * 5, bottomY)
                let result = findInBand(anchorX, bandTop, strictBottom, logoW, logoH, searchRadius)

                if (result) {
                    placeLogo(container, tag.imageAddress, result.x, result.y, logoW, logoH, tag.name)
                    placedLogos.push({ left: result.x, top: result.y, right: result.x + logoW, bottom: result.y + logoH })
                    console.log(`[Logo] ${tag.name} ${logoW}×${logoH} TOPBAND at (${Math.round(result.x)},${Math.round(result.y)}) f:${f}`)
                    placed = true
                    break
                }
            }

            // PASS 2: if nothing fit in top 5 rows even at smallest size,
            // expand to full house height (still top-first, still won't go below house)
            if (!placed) {
                for (let f of sizeFactors) {
                    let logoW = Math.max(60, Math.floor(baseW * f))
                    let logoH = Math.max(40, Math.round(logoW / ratio))
                    let result = findInBand(anchorX, bandTop, bottomY, logoW, logoH, searchRadius)
                    if (result) {
                        placeLogo(container, tag.imageAddress, result.x, result.y, logoW, logoH, tag.name)
                        placedLogos.push({ left: result.x, top: result.y, right: result.x + logoW, bottom: result.y + logoH })
                        console.log(`[Logo] ${tag.name} ${logoW}×${logoH} FULLHOUSE at (${Math.round(result.x)},${Math.round(result.y)}) f:${f}`)
                        placed = true
                        break
                    }
                }
            }

            // PASS 3: absolute last resort — place above house, never below
            if (!placed) {
                let logoW = Math.max(60, Math.floor(baseW * 0.3))
                let logoH = Math.max(40, Math.round(logoW / ratio))
                let fx = Math.max(10, anchorX - logoW / 2)
                let fy = Math.max(5, topY - logoH - 5)
                for (let attempt = 0; attempt < 50; attempt++) {
                    if (!placedLogos.some(b => fx < b.right && fx+logoW > b.left && fy < b.bottom && fy+logoH > b.top)) {
                        placeLogo(container, tag.imageAddress, fx, fy, logoW, logoH, tag.name)
                        placedLogos.push({ left: fx, top: fy, right: fx+logoW, bottom: fy+logoH })
                        console.warn(`[Logo] ABOVE FALLBACK ${tag.name} at y:${Math.round(fy)}`)
                        break
                    }
                    fy -= logoH + 5
                }
            }
        })
    })
}

function getTreeScale(container) {
    let match = (container.treeDiv.style.transform || '').match(/scale\(([^)]+)\)/)
    return match ? parseFloat(match[1]) : 1
}

// Updated placeLogo — uses explicit width+height on div so collision rect matches display
function placeLogo(container, logoSrc, xPos, yPos, logoWidth, logoHeight, tagName) {
    if (!container || !container.treeDiv) return
    let logoDiv = document.createElement('div')
    logoDiv.classList.add('logo')
    logoDiv.style.position   = 'absolute'
    logoDiv.style.left       = `${xPos}px`
    logoDiv.style.top        = `${yPos}px`
    logoDiv.style.width      = `${logoWidth}px`
    logoDiv.style.height     = `${logoHeight}px`
    logoDiv.style.zIndex     = '1'
    logoDiv.style.cursor     = 'grab'
    logoDiv.style.opacity    = '1'
    logoDiv.style.transition = 'opacity 0.15s'

    let tooltip = document.createElement('div')
    tooltip.textContent = 'Drag to move • Shift+drag to resize'
    tooltip.style.cssText = `
        position: absolute;
        bottom: calc(100% + 6px);
        left: 50%;
        transform: translateX(-50%);
        transform-origin: bottom center;
        background: rgba(0,0,0,0.75);
        color: white;
        font-size: 11px;
        font-family: Arial, sans-serif;
        padding: 4px 8px;
        border-radius: 4px;
        white-space: nowrap;
        pointer-events: none;
        display: none;
        z-index: 1000;
    `
    logoDiv.appendChild(tooltip)

    logoDiv.addEventListener('mouseenter', () => {
        if (!logoDiv._dragging) {
            logoDiv.style.opacity = '0.7'
            let scale = getTreeScale(container)
            tooltip.style.transform = `translateX(-50%) scale(${1 / scale})`
            tooltip.style.display = 'block'
        }
    })
    logoDiv.addEventListener('mouseleave', () => {
        if (!logoDiv._dragging) {
            logoDiv.style.opacity = '1'
            tooltip.style.display = 'none'
        }
    })

    logoDiv.addEventListener('mousedown', (e) => {
        e.preventDefault()
        e.stopPropagation()
        tooltip.style.display = 'none'

        let startX   = e.clientX
        let startY   = e.clientY
        let origLeft = parseInt(logoDiv.style.left)
        let origTop  = parseInt(logoDiv.style.top)
        let origW    = parseInt(logoDiv.style.width)
        let origH    = parseInt(logoDiv.style.height)
        let isResize = e.shiftKey
        let didDrag  = false

        logoDiv._dragging = true
        logoDiv.style.cursor  = isResize ? 'nwse-resize' : 'grabbing'
        logoDiv.style.opacity = '1'
        logoDiv.style.zIndex  = '999'

        const onMouseMove = (e) => {
            let dx = e.clientX - startX
            let dy = e.clientY - startY
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag = true

            if (isResize) {
                let scale = 1 + dx / 200
                let newW = Math.max(40, Math.round(origW * scale))
                let newH = Math.max(30, Math.round(origH * scale))
                logoDiv.style.width  = newW + 'px'
                logoDiv.style.height = newH + 'px'
                logoDiv.style.left   = (origLeft - (newW - origW) / 2) + 'px'
                logoDiv.style.top    = (origTop  - (newH - origH) / 2) + 'px'
            } else {
                logoDiv.style.left = (origLeft + dx) + 'px'
                logoDiv.style.top  = (origTop  + dy) + 'px'
            }
        }

        const onMouseUp = (e) => {
            document.removeEventListener('mousemove', onMouseMove)
            document.removeEventListener('mouseup', onMouseUp)

            logoDiv._dragging = false
            logoDiv.style.cursor = 'grab'
            logoDiv.style.zIndex = '1'

            if (!didDrag) {
                let tag = getTag(tagName)
                if (tag) showTab(tagToTab(tag))
            }
        }

        document.addEventListener('mousemove', onMouseMove)
        document.addEventListener('mouseup', onMouseUp)
    })

    let img = document.createElement('img')
    img.src              = logoSrc
    img.style.width      = '100%'
    img.style.height     = '100%'
    img.style.objectFit  = 'contain'
    img.style.pointerEvents = 'none'
    logoDiv.appendChild(img)
    container.treeDiv.appendChild(logoDiv)
}

function createHouseBackground(container) {
    let taggedHouses = container.houses
        .map(h => getTag(h))
        .filter(t => t && t.imageAddress)

    if (taggedHouses.length > 5) return

    let primaryTag = taggedHouses.sort((a, b) => {
        let aC = container.siblings.filter(s => s.house === a.name && !s.tags.includes('stub')).length
        let bC = container.siblings.filter(s => s.house === b.name && !s.tags.includes('stub')).length
        return bC - aC
    })[0]

    if (!primaryTag) return

    let tabDiv = container.structure['tabs']
    tabDiv.style.position = 'relative'
    tabDiv.style.overflow = 'hidden'

    let bg = document.createElement('img')
    bg.src = primaryTag.imageAddress
    bg.style.position      = 'absolute'
    bg.style.top           = '50%'
    bg.style.left          = '50%'
    bg.style.transform     = 'translate(-50%, -50%)'
    bg.style.width         = 'min(75vh, 75vw)'
    bg.style.opacity       = '0.08'
    bg.style.pointerEvents = 'none'
    bg.style.zIndex        = '0'
    bg.style.objectFit     = 'contain'

    tabDiv.insertBefore(bg, tabDiv.firstChild)
}
// // Function to place a logo at a specific position in the tree
// function placeLogo(container, logoSrc, xPos, yPos, logoWidth, logoHeight) {

//     if (!container || !container.treeDiv) {
//         console.error("treeDiv is not defined for the container.");
//         return;
//     }

//     let logoDiv = document.createElement("div");
//     logoDiv.classList.add("logo");  // You can style this class to control its appearance
//     logoDiv.style.position = "absolute";
//     logoDiv.style.left = `${xPos}px`;   // Position the logo horizontally (adjust as needed)
//     logoDiv.style.top = `${yPos}px`;    // Position the logo vertically (adjust as needed)
//     logoDiv.style.width = `${logoWidth}px`;  // Set logo width
//     logoDiv.style.height = `${logoHeight}px`; // Set logo height

//     let img = document.createElement("img");
//     console.log(logoSrc);
//     img.src = "https://drive.google.com/thumbnail?id=" + logoSrc; // Path to the logo
//     img.alt = "Tree Logo";  // Alt text for accessibility
//     img.style.width = "100%";  // Make sure the image fits the container
//     img.style.height = "100%"; // Adjust to fit within the div

//     logoDiv.appendChild(img);
//     container.treeDiv.appendChild(logoDiv);  // Append logo to the tree container
// }