var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Econtract;
(function (Econtract) {
    var Toolbox;
    (function (Toolbox) {
        Toolbox.Config = {
            apiEndpoint: '',
            postcodeSelector: ".postcode",
            citySelector: ".city",
            streetSelector: ".street",
            delay: 0,
            accessToken: ""
        };
        var Client = (function () {
            function Client(endpoint) {
                this.endpoint = endpoint ? endpoint : Toolbox.Config.apiEndpoint;
            }
            Client.prototype.get = function (uri, query) {
                return $.get(this.endpoint + uri, $.extend({ toolbox_key: Toolbox.Config.accessToken }, query));
            };
            Client.prototype.findOneCityByPostcode = function (postcode, callback) {
                this.get('/cities', { postcode: postcode })
                    .success(function (response) {
                    if (response.length) {
                        callback(response[0]);
                    }
                    else {
                        callback(null);
                    }
                }).error(function () {
                    callback(null);
                });
            };
            return Client;
        }());
        Toolbox.Client = Client;
        var Autocomplete = (function () {
            function Autocomplete(endpoint, paramName) {
                this.params = {};
                this.delay = Toolbox.Config.delay;
                this.minChars = 1;
                this.paramName = paramName;
                this.endpoint = endpoint;
                this.params = {
                    toolbox_key: Toolbox.Config.accessToken
                };
            }
            Autocomplete.prototype.addParam = function (name, value) {
                this.params[name] = value;
            };
            Autocomplete.prototype.create = function (input) {
                return input.devbridgeAutocomplete({
                    autoSelectFirst: true,
                    paramName: this.paramName,
                    serviceUrl: this.endpoint,
                    dataType: 'json',
                    deferRequestBy: this.delay,
                    transformResult: this.transformResultCallback,
                    onSelect: this.onSelectCallback,
                    params: this.params,
                    minChars: this.minChars
                });
            };
            return Autocomplete;
        }());
        var CityAutocomplete = (function (_super) {
            __extends(CityAutocomplete, _super);
            function CityAutocomplete() {
                _super.apply(this, arguments);
                this.transformResultCallback = function (response) {
                    return {
                        suggestions: $.map(response, function (item) {
                            return { value: item.postcode + ' - ' + item.name, data: item };
                        })
                    };
                };
            }
            return CityAutocomplete;
        }(Autocomplete));
        var AddressAutocomplete = (function () {
            function AddressAutocomplete(endpoint) {
                this.endpoint = endpoint ? endpoint : Toolbox.Config.apiEndpoint;
            }
            AddressAutocomplete.prototype.create = function (input) {
                var self = this;
                function setCityOnSelect(suggestion) {
                    self.setCity(suggestion.data);
                }
                if (this.postcodeElement) {
                    var postcodeAutocomplete = new CityAutocomplete(this.endpoint + '/cities', 'postcode');
                    postcodeAutocomplete.onSelectCallback = setCityOnSelect;
                    postcodeAutocomplete.create(this.postcodeElement);
                }
                if (this.cityElement) {
                    var cityAutocomplete = new CityAutocomplete(this.endpoint + '/cities', 'name');
                    cityAutocomplete.onSelectCallback = setCityOnSelect;
                    cityAutocomplete.minChars = 2;
                    cityAutocomplete.create(this.cityElement);
                }
                if (this.postcodeElement.val()) {
                    var client = new Client();
                    client.findOneCityByPostcode(this.postcodeElement.val(), function (city) {
                        self.setCity(city);
                    });
                }
                else {
                    this.setCity(null);
                }
            };
            AddressAutocomplete.streetTransformResultCallback = function (response) {
                return {
                    suggestions: $.map(response, function (item) {
                        return { value: item.name, data: item };
                    })
                };
            };
            AddressAutocomplete.prototype.setCity = function (city) {
                if (this.streetElement) {
                    if (this.city && city) {
                        if (city.id != this.city.id) {
                            this.streetElement.val('');
                        }
                    }
                    this.streetElement.prop('readonly', !city);
                }
                this.city = city;
                if (city) {
                    this.cityElement.val(city.name);
                    this.postcodeElement.val(city.postcode);
                    if (this.streetElement) {
                        var autocomplete = new Autocomplete(this.endpoint + '/streets', 'name');
                        autocomplete.transformResultCallback = AddressAutocomplete.streetTransformResultCallback;
                        autocomplete.minChars = 3;
                        autocomplete.addParam("city_id", this.city.id);
                        autocomplete.create(this.streetElement);
                        this.streetElement.focus();
                    }
                }
            };
            return AddressAutocomplete;
        }());
        Toolbox.AddressAutocomplete = AddressAutocomplete;
    })(Toolbox = Econtract.Toolbox || (Econtract.Toolbox = {}));
})(Econtract || (Econtract = {}));
(function ($) {
    $.fn.addressAutocomplete = function (options) {
        $(this).each(function (i, elem) {
            options = $.extend(Econtract.Toolbox.Config, options);
            var autocomplete = new Econtract.Toolbox.AddressAutocomplete(options.apiEndpoint);
            autocomplete.postcodeElement = $(options.postcodeSelector, elem);
            autocomplete.cityElement = $(options.citySelector, elem);
            autocomplete.streetElement = $(options.streetSelector, elem);
            autocomplete.create(elem);
        });
    };
})(jQuery);
//# sourceMappingURL=econtract-toolbox.js.map