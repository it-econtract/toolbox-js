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