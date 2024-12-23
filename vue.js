function loadVue() {
    appElement = new Vue({
        el: '#app',
        data: {
            tabHistory: [{ tabType: 'load' }],
            tabPosition: 0,
            split: null,
            settings: null
        },
        methods: {
            getDisplayTab: function() {
                return this.tabHistory[this.tabPosition].tabType
            },
            getTabData: function() {
                return this.tabHistory[this.tabPosition]
            },
            getSettings: function() {
                return this.settings
            },
            canGoBackward: function() {
                return this.tabPosition > 1
            },
            canGoForward: function() {
                return this.tabPosition < this.tabHistory.length - 1
            },
            applyTagHoverFromTab: function(tagName) {
                tag = getTag(tagName)
                $( "." + tag.iconClassName ).addClass("hoverFromTab")
            },
            applySibHoverFromTab: function(sib) {
                $( "#" + cleanStr(sib.name) + " button" ).addClass("hoverFromTab")
            },
            removeHoverFromTab: function() {
                $( ".hoverFromTab" ).removeClass("hoverFromTab")
            },
            displayTagInfo: function(tagName) {
                console.log("Displaying " + tagName + " from menu")
                tag = getTag(tagName)
                tabData = tagToTab(tag)
                showTab(tabData)
            },
            sibToName: function(sib) {
                console.log("Displaying " + sib.name + " from a sibling")

                if (sib.tags.includes('stub')) {
                    tag = getTag(sib.house)
                    tabData = tagToTab(tag)
                    tabData.ele = ele
                    showTab(tabData)
                }
                else if (sib.container) {
                    tabData = sibToTab(sib)
                    showTab(tabData)
                }
                else this.tagToName(sib.name)
            },
            tagToName: function(sibName) {
                console.log("Displaying " + sibName + " from a tag")

                var newSib
                if (containers.some(cont => {
                    newSib = cont.siblings.find(sib => sib.name == sibName)
                    if (newSib) return true
                })) {
                    tabData = sibToTab(newSib)
                }
                // If this sibling does not exist in any container
                else tabData = containerlessSibToTab(sibName)

                showTab(tabData)
            }
        }
    })
}