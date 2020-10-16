// DECLARATIONS **********************************

let ProductsObj;  
let currentBasket;
let xchg;


// CONSTANTS **********************************

// Format numbers in GBP
const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2
});

// test or live mode
const liveMode = true;

// User error message for live mode
const liveErrorMsg = "We are very sorry, but we seem to have experienced a problem. Please try again later."


// CLASSES **********************************

// Class to handle all basket details
class Basket{
    constructor(element){
        // Create array to hold details of items in basket
        this.productsInBasket = new Array;
    }

    // Remove item from basket
    removeFromB(productIDToRemove){            
        for(let i = 0; i < this.productsInBasket.length; i++) {
            if (this.productsInBasket[i].productId == productIDToRemove) {
                // Product ID found - remove it
                this.productsInBasket.splice(i, 1);
                break;
            }
        }          
        this.updateFrontEnd();
        changeAlt();
    }

    // Add items to basket
    addToB(productIDToAdd, GBPToAdd, nameToAdd, unitToAdd){
        // Get number of items to add
        let itemsToAdd = parseFloat(document.getElementById('count-' + productIDToAdd).value);

        // validate input
        if(itemsToAdd==0){
            return
        }else if(itemsToAdd < 0 || !(Number.isInteger(itemsToAdd))){
            showConfirmPurchaseDialog('inputErrorDialog');
            return;
        }

        // Check if product is already in object:
        let found = false;
        for(let i = 0; i < this.productsInBasket.length; i++) {
            if (this.productsInBasket[i].productId == productIDToAdd) {
                // Product ID found - add additional items
                this.productsInBasket[i].num += itemsToAdd
                found = true;
                break;
            }
        }

        if (!found){
            // Add products (which have not been previously added)
            let prodToAddObj = {productId:productIDToAdd, num:itemsToAdd, GBP:GBPToAdd, name:nameToAdd, unit:unitToAdd};
            this.productsInBasket.push(prodToAddObj);
        }

        // Clear value from item's number field
        document.getElementById('count-' + productIDToAdd).value = 0;

        this.updateFrontEnd();
        showItemsDialog();
    }

    // Update all relevant front end items following a change to details
    updateFrontEnd(){
        // Count items and values in basket
        let itemCount = 0;
        this.itemValue = 0;
        let itemsTable = "<table class='checkout'>";
        for(let i = 0; i < this.productsInBasket.length; i++) {
            // Count items
            itemCount += this.productsInBasket[i].num;
            let subTotal = this.productsInBasket[i].num * this.productsInBasket[i].GBP;
            this.itemValue += subTotal;

            // Add items to checkout field
            itemsTable += '<tr><td class="removeCells"><input type="button" class="w3-button w3-white w3-border w3-border-black" value="Remove" onClick="currentBasket.removeFromB(\'' + 
            this.productsInBasket[i].productId +
            '\')"></td><td class="itemsLeft">' + this.productsInBasket[i].num + ' x ' + this.productsInBasket[i].name +
            ' (' + this.productsInBasket[i].unit + ')</td><td class="itemsRight">' + formatter.format(subTotal) + '</td></tr>';
        }
        document.getElementById('basketItems').innerHTML = itemsTable +
        "<tr><td>&nbsp;</td></tr><tr><td></td><td class='itemsLeft enbolden'>TOTAL</td><td class='itemsRight enbolden'>" + formatter.format(this.itemValue) + "<td></tr></table>"

        // Update display of small basket
        document.getElementById('provNumItems').value = itemCount;
        document.getElementById('provVal').value = formatter.format(this.itemValue);

        // Enable or disable Checkout button based on whether there are items in the basket
        document.getElementById('checkoutButton').disabled = (itemCount==0)

        // Enable or disable Confirm Purchases button based on whether there are items in the basket
        document.getElementById('confirmPurchases').disabled = (itemCount==0)
    }

    getBasketTotal(){
        return this.itemValue;
    }
}

// Class to create HTML for an individual product
class Product{
    constructor(element){
        this.name = element.name;
        this.GBP = element.GBP;
        this.unit = element.unit;
        this.image = element.image;
        this.productID = element.productID
    }

    getHTMLOutput(){
        let newDiv = document.createElement('div');
        newDiv.innerHTML = '<div><p class="prodName">' + this.name + '</p><img src="images/' + this.image + '" class="prodImg"><p>' + 
        formatter.format(this.GBP) + ' per ' + this.unit +
        '</p><p><input type="button" class="smallB" value="-" onClick="subFromFld(\'' + this.productID + '\')">' +
        '<input class="prods" type="number" value="0" min="0" id="count-' + this.productID + '">' +
        '<input type="button" class="smallB" value="+" onClick="addToFld(\'' + this.productID + '\')">' +
        '</p><input type="button" class="w3-button w3-white w3-border w3-border-black" value="Add to basket" onClick="currentBasket.addToB(\'' + this.productID + '\',\'' + this.GBP + '\',\'' + this.name + '\',\'' + this.unit + '\')">' + 
        '</div>' 

        newDiv.id = "count_" + this.productID;
        
        // Add new HTML to DOM element
        document.getElementById("prods").appendChild(newDiv);
    }
}

// Class to handle all details of alternative currencies
class CurrencyExchange{

    // Load all curencies
    constructor(quotesObj){
        this.quotes = quotesObj;
    }

    // Return rate of selected currency compared to GBP
    getRate(currencyPair){
        return this.quotes['USD' + currencyPair] / this.quotes.USDGBP;
    }

    // Add select input option for each alternative currency (except GBP!)
    getCurrencies(selectField){
        // add default blank entry               
        let opt = document.createElement("option");
        selectField.add(opt);

        // Create list of currencies
        for(let curr in this.quotes){
            let currABC = curr.substring(3,6);
            if(currABC != "GBP"){
                let opt = document.createElement("option");
                opt.value = currABC;
                opt.text = currABC;
                selectField.add(opt);
            }                    
        }
    }
}


// FUNCTIONS **********************************

// Download currency exchange rates from web
function downloadXchgRates(){
    console.log('xchg');
    $.getJSON('http://www.apilayer.net/api/live?access_key=593f3f6eeea55088b3cc81eef803b24f&format=1')
    .done(function(data){       
        // let currencyObj = data;
        xchg = new CurrencyExchange(data.quotes);

        //Load currency options into select input
        xchg.getCurrencies(document.getElementById('altCurr'))
    })
    .fail(function(){
        if(liveMode){
            alert(liveErrorMsg)
        }else{
            alert(err)
        }       
    })
}

// Switch display between shop from and checkout
function Switcheroo(boo){
    if(boo){
        document.getElementById('shopFront').style.visibility = "hidden";
        document.getElementById('checkout').style.visibility = "visible";
        document.getElementById('shopFrontGuidance').innerHTML = "Please confirm your selections:";
        changeAlt();
    }else{               
        document.getElementById('shopFront').style.visibility = "visible";
        document.getElementById('checkout').style.visibility = "hidden";
        document.getElementById('shopFrontGuidance').innerHTML = "Please select from our range of products below:";
    }
    window.scrollTo(0, 0);
}

// Display alternative currency amount
function changeAlt(){
    let xchgVal = 0;
    let currentSelection = document.getElementById("altCurr").value
    if(currentSelection != ""){
        let newRate = xchg.getRate(currentSelection);
        xchgVal = newRate * currentBasket.getBasketTotal();
    }
    document.getElementById('altVal').value = xchgVal.toFixed(2);
}

// Increment number of items ordered
function addToFld(productID){
    document.getElementById('count-' + productID).value = parseInt(document.getElementById('count-' + productID).value) + 1;
}    

// Decremant number of items ordered
function subFromFld(productID){
    currentVal = parseInt(document.getElementById('count-' + productID).value);
    if(currentVal > 0){document.getElementById('count-' + productID).value = currentVal - 1;}
}

// Load the products from the JSON source
function loadProducts(){
    try{
//    function loadJSON(callback) {   
//
//       let xobj = new XMLHttpRequest();
//        xobj.overrideMimeType("application/json");
//        xobj.open('GET', 'products.json', true);
//        xobj.onreadystatechange = function () {
//            if (xobj.readyState == 4 && xobj.status == "200") {
                // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
//                callback(xobj.responseText);
//            }
//        };
//        xobj.send(null);  
//    }

//    loadJSON(function(response) {
    // Parse JSON string into object
//        ProductsObj = JSON.parse(response);
        ProductsObj = JSON.parse(`
        {
            "name": "Products",
            "updated": "2018-09-30 12:08:00",
            "products":[
                {"productID":"1", "name":"Peas", "GBP":".95", "unit":"bag", "image":"peas_sized.jpg"},
                {"productID":"2", "name":"Eggs", "GBP":"2.1", "unit":"dozen", "image":"eggs_sized.jpg"},
                {"productID":"3", "name":"Milk", "GBP":"1.3", "unit":"bottle", "image":"milk_sized.jpg"},
                {"productID":"4", "name":"Beans", "GBP":".73", "unit":"can", "image":"beans_sized.jpg"}
            ]
        }
        `)
        ProductsObj.products.forEach(function(element){
            let thisProd = new Product(element);
            thisProd.getHTMLOutput();
        });
//    });



    // Set up basket
    currentBasket = new Basket;
    }
    catch(err){
        if(liveMode){
            alert(liveErrorMsg)
        }else{
            alert(err)
        }
        
    }
};


// Show the items added dialog box function
function showItemsDialog(){
    $( function() {
        $( "#dialog" ).dialog({
            dialogClass: "no-close",
            modal: true,
            resizable: false,	
            minWidth: 400,
            show: { 
                duration: 500 
            },
            classes: {
                "ui-dialog-titlebar": "myDialogTitleBarClass", "ui-dialog-content": "myDialogContentClass"
            },
            open: function(event, ui){
                setTimeout("$('#dialog').dialog('close')",1500);
            },
            hide: {
            effect: 'fade',
            duration: 1000,
            },
        });
    });
}

// Confirm purchases and input error dialog box function
function showConfirmPurchaseDialog(itemID){
    $( function() {
        $( "#" + itemID ).dialog({
            dialogClass: "no-close",
            modal: true,
            resizable: false,	
            minWidth: 400,
            show: { 
                duration: 500 
            },
            classes: {
                "ui-dialog-titlebar": "myDialogTitleBarClass", "ui-dialog-content": "myDialogContentClass"
            },
            buttons: {
                "OK": function() {
                    $( this ).dialog( "close" );
                }
            },
        });
    });
}