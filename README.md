Usage
===

```html
<div class="row" id="address">
    <div class="col-sm-2">
        <input class="form-control postcode" type="text" name="postcode" placeholder="Postcode" />
    </div>
    <div class="col-sm-5">
        <input class="form-control city" type="text" name="city" placeholder="City" />
    </div>
    <div class="col-sm-5">
        <input class="form-control street" type="text" name="city" placeholder="Street" />
    </div>
</div>

<script type="text/javascript">
$('#address').addressAutocomplete({
    apiEndpoint: 'https://toolbox.econtract.be'
});
</script>
```

Retrieving address information
---
To retrieve address information after it has beed filled in by user:

```
var autocomplete = $('#address').data('autocomplete');

console.log(autocomplete.city);
// Object {id: 1024, language: "nl", latitude: 50.830001, longitude: 4.329999, name: "Bruxelles", parent: null, postcode: 1000, province:Object}

console.log(autocomplete.street);
// Object {city: "Brussel", city_id: 1024, id: 19080, language: "nl", locale: null, name: "Grote Markt", postcode: 1000, province: "Brussel", province_id: 1}

console.log(autocomplete.address);
// Object {postcode: 1000, city: "Brussel", street: "Marnixlaan", house_number: "12", box: "3"}
```

*WARNING*: Properties `autocomplete.city` and `autocomplete.street` might be undefined if toolbox API doesn't have an information about city or street entered.
Property `autocomplete.address` always exists and have values coresponding to form input values.

Global configuration
---
You can change the global configuration in this way:

```js
Econtract.Toolbox.Config = {
    apiEndpoint: 'https://toolbox.econtract.be',
    postcodeSelector: ".postcode",
    citySelector: ".city",
    streetSelector: ".street"
}
```

Than it's possible to omit the apiEndpoint option when creating address autocomplete.

Advanced usage
--------------

```
<div class="row">
    <div class="col-sm-6">
        <div class="row" id="address-with-ean-empty">
            <div class="col-sm-4">
                <input class="form-control postcode" type="text" name="postcode" placeholder="Postcode" value="" />
            </div>
            <div class="col-sm-8">
                <input class="form-control city" type="text" name="city" placeholder="City" value="" />
            </div>
            <div class="col-sm-8">
                <input class="form-control street" type="text" name="city" placeholder="Street" value="" />
            </div>
            <div class="col-sm-2">
                <input class="form-control house-number" type="text" name="city" placeholder="House nr" value="" />
            </div>
            <div class="col-sm-2">
                <input class="form-control box-number" type="text" name="city" placeholder="Box" value="" />
            </div>
        </div>
    </div>
    <div class="col-sm-6">
        <div class="col-sm-12">
            <input id="ean-for-address-with-ean-empty" class="form-control ean" type="text" name="ean" placeholder="EAN" value="" />
        </div>
    </div>
<script>
$('#ean-for-address-with-ean').eanAutocomplete({
    addressSelector: '#address-with-ean',
    energyType: 'gas'
});
</script>
```

Development
===

Prerequisites
---

Install:
 * nodejs
 * typescript
 * typings

```bash
bower install
npm install typings --global
typings install jquery --global --source=dt
```


Build
===

Compile TypeScript using:

```bash
tsc
```