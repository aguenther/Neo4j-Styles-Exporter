// ==UserScript==
// @name           Neo4j Style Exporter
// @namespace      cxo
// @match          http://localhost/*webadmin*
// ==/UserScript==


function main(){
    var 
        stylesDiv,//the main div of the overlay
        stylesTextarea,//textarea where to put the styles json
        $;
        
    /**
     * add my CSS to the page
     */
    function injectCSS()
    {
        var css = 
            "div#style-overlay {" +
            "padding:5px;"+
            "border: 1px solid #AAAAAA; background-color: #EFEFEF;"+
            "position: absolute; right: 10px; top:60px; "+
            "z-index:500;"+
            "box-shadow: 0 0 8px 0 #888888; border-radius: 2px 2px 2px 2px;"+
            "}"+
            "div#style-overlay textarea{"+
            "width:500px;"+
            "height:250px;"+
            "}"+
            /*"div#style-overlay input{"+
            "border-radius: 8px"+
            "}"+*/
            "";
        $('<style type="text/css">'+css+'</style>').appendTo('head');
        
    }
    
    /**
     * generate the element with the textarea and so on
     */
    function createOverlay()
    {
        var saveButton,
            cancelButton,
            addButton;
            
        
        stylesDiv = $('<div id="style-overlay"></div>').appendTo('body').hide();
        
        
        
        stylesTextarea = $("<textarea></textarea>").appendTo(stylesDiv);
        
                
        stylesDiv.append('<br/>');
        
        saveButton = $('<input type="button" class="micro-button" value="Replace Profiles" />');//document.createElement("input");
        cancelButton = $('<input type="button" class="micro-button bad-button" value="Close" />');//document.createElement("input");
        addButton = $('<input type="button" class="micro-button" value="Add/Update Profiles" />');//document.createElement("input");
        
        
        stylesDiv.append(saveButton);
        stylesDiv.append(addButton);
        stylesDiv.append(cancelButton);
        
        saveButton.click(function(){
            saveProfiles();
        });
        
        addButton.click(function(){
            addProfiles();
        });
        
        cancelButton.click(function(){
            stylesDiv.hide();
        });
        
    }
        
        
    function saveProfiles()
    {
        var newText = stylesTextarea.val(),
            newData;
        if(newText == '') {
            if(confirm('Clear custom profiles?')) {
                localStorage.removeItem('databrowser.visualization.currentProfile');
                localStorage.removeItem('databrowser.visualization.profiles');
                alert('Cleared successfully.');
            }
        } else {
            //do some validation
            try {                
                newData = JSON.parse(newText);
            } catch(err) {
                newData = null;
            }
            if(!newData) {
                alert('That data does not look like a valid JSON...');
                return;
            }
            if(!localStorage['databrowser.visualization.profiles'] || confirm('Overwrite profile data?')) {
                localStorage['databrowser.visualization.currentProfile'] = '0';
                localStorage['databrowser.visualization.profiles'] = newText;
                alert("Data written.");
                window.location.reload();
            }
        }
    }

    function addProfiles()
    {
        var dataFromField,    //data which was entered
            dataFromStorage,//data which is in there ATM
            highestID = 0,      //highest ID in storage
            i, curName, curEntry, oldIndex, //temp vars
            numAdded = 0,       //how many were added?
            numUpdated = 0,     //how many were updated?               
            stylesByName = {};  //style name => index in dataFromStorage
            
        if(!localStorage['databrowser.visualization.profiles']) {
            return saveProfiles();//do return instead
        }
            
        try {
            dataFromField = JSON.parse(stylesTextarea.val());
        } catch(err) {
            alert('That data does not look like a valid JSON...');
            return;
        }
        try {
            dataFromStorage = JSON.parse(localStorage['databrowser.visualization.profiles']);
        } catch(err) {
            alert('Could not parse the data from local storage. It might be a good idea to clear it.');
            return;
        }
            
        //find highest ID and fill stylesByName
        for(i=0;i<dataFromStorage.length;i++) {
            curEntry = dataFromStorage[i];
            if(typeof(curEntry.id) == 'undefined' || typeof(curEntry.name) == 'undefined') {
                alert("Data in storage seems to be invalid");
                return;
            }
            
            if(curEntry.id > highestID) {
                highestID = dataFromStorage[i].id;
            }
            curName = curEntry.name;
            stylesByName[curName] = i;//save the index
        }
        
        for(i=0;i<dataFromField.length;i++) {
            curEntry = dataFromField[i];
            //ignore default
            if(curEntry.id == 0) {
                continue;
            }
            if(typeof(curEntry.id) == 'undefined' || typeof(curEntry.name) == 'undefined') {
                alert("Input Data seems to be invalid");
                return;
            }        
            curName = curEntry.name;
            
            if(typeof(stylesByName[curName]) == 'undefined') {
                //add as new
                highestID++;
                curEntry.id = highestID;
                dataFromStorage.push(curEntry);
                numAdded++;
            } else {
                //replace the one we alerady have
                oldIndex = stylesByName[curName];
                curEntry.id = dataFromStorage[oldIndex].id;
                dataFromStorage[oldIndex] = curEntry;
                numUpdated++;
            }
        }
        
        localStorage['databrowser.visualization.profiles'] = JSON.stringify(dataFromStorage);
        stylesTextarea.val(localStorage['databrowser.visualization.profiles']);
        alert(numAdded+" profiles has been added, "+numUpdated+" profiles were updated.");
        window.location.reload();
    }
    
    function showOverlay()
    {
        if(typeof(localStorage['databrowser.visualization.profiles']) != 'undefined') {        
            stylesTextarea.val(localStorage['databrowser.visualization.profiles']);
        } else {
            stylesTextarea.val("");
        }
        stylesDiv.show();
    }
    
    /**
     * add my extra button, if not alerady there. neo4j deletes and recreates its DOM quite often, so I have to recreate the button as well
     * */
    function addButton(){
        
        if($('#style-export-button').length != 0 || $('#visualization-profiles-button') == 0) {
            //don't add if we either alerady have the button, or if the style button is missing
            return;
        }
        //select the button after which I want to inject. it is directly inside of a LI, as opposed to the Edit and Delete buttons
        $('body > div.dropdown > ul > li > a.micro-button').after('<a href="javascript:void(0)" class="micro-button" id="style-export-button">Export/Import...</a>');
        //the button is triggered via event delegation, this way I don't have to rebind it every time
    }
    
    function init() {
        
        $ = window.$;
        
        injectCSS();
        createOverlay();
        
        $('body')
            .delegate('#visualization-profiles-button', 'click', addButton)
            .delegate('div.dropdown', 'DOMSubtreeModified', addButton)
            .delegate('#style-export-button', 'click', showOverlay);
    }
    
    /****************************** BEGIN EVIL CODE ******************************/
    //use timeouts to wait for $...
    if(typeof(window.$) === 'undefined') {
        window.setTimeout(main, 250);
        return;
    }
    /******************************  END EVIL CODE  ******************************/
    
    init();
    
};

/******************************  END MAIN CODE  ******************************/
//the rest is just the necessary stuff to make function main() run
//since the URL is unreliable (usually localhost:xxxx, since we tunnel a lot), check the title...
if(document.getElementsByTagName("title")[0].innerHTML == 'Neo4j Monitoring and Management Tool') { 
    
    var prevEvent, scriptTag;
    
    //evil hack. injects code into the page. This way I can use jQuery.
    //in Firefox, I could use unsafeWindow.$, but not in Chrome

    var scriptTag = document.createElement("script");
    scriptTag.textContent = "(" + main.toString() + ")();";
    document.body.appendChild(scriptTag);
}
