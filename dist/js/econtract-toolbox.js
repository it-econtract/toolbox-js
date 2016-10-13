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
            apiKey: '',
            postcodeSelector: ".postcode",
            citySelector: ".city",
            streetSelector: ".street",
            houseNumberSelector: ".house-number",
            boxNumberSelector: ".box-number",
            delay: 0,
        };
        var Client = (function () {
            function Client(endpoint) {
                this.endpoint = endpoint ? endpoint : Toolbox.Config.apiEndpoint;
            }
            Client.prototype.get = function (uri, query) {
                return $.get(this.endpoint + uri, $.extend({ toolbox_key: Toolbox.Config.apiKey }, query));
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
            Client.prototype.findCitiesByPostcode = function (postcode, callback) {
                this.get('/cities', { postcode: postcode })
                    .success(function (response) {
                    if (response.length) {
                        callback(response);
                    }
                    else {
                        callback([]);
                    }
                }).error(function () {
                    callback([]);
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
                    toolbox_key: Toolbox.Config.apiKey
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
        var StreetAutocomplete = (function (_super) {
            __extends(StreetAutocomplete, _super);
            function StreetAutocomplete() {
                _super.apply(this, arguments);
                this.minChars = 3;
                this.transformResultCallback = function (response) {
                    return {
                        suggestions: $.map(response, function (item) {
                            return { value: item.name, data: item };
                        })
                    };
                };
            }
            return StreetAutocomplete;
        }(Autocomplete));
        var AddressAutocomplete = (function () {
            function AddressAutocomplete(endpoint) {
                this.address = {};
                this.endpoint = endpoint ? endpoint : Toolbox.Config.apiEndpoint;
            }
            AddressAutocomplete.prototype.create = function (input) {
                var self = this;
                this.addressElement = $(input);
                function setCityOnSelect(suggestion) {
                    self.setCity(suggestion.data);
                }
                if (this.postcodeElement.length) {
                    var postcodeAutocomplete = new CityAutocomplete(this.endpoint + '/cities', 'postcode');
                    postcodeAutocomplete.onSelectCallback = setCityOnSelect;
                    postcodeAutocomplete.create(this.postcodeElement);
                }
                if (this.cityElement.length) {
                    var cityAutocomplete = new CityAutocomplete(this.endpoint + '/cities', 'name');
                    cityAutocomplete.onSelectCallback = setCityOnSelect;
                    cityAutocomplete.minChars = 2;
                    cityAutocomplete.create(this.cityElement);
                }
                if (this.houseNumberElement.length) {
                    this.houseNumberElement.on('change', function () {
                        self.updateAddress();
                    });
                }
                if (this.boxNumberElement.length) {
                    this.boxNumberElement.on('change', function () {
                        self.updateAddress();
                    });
                }
                if (this.postcodeElement.val()) {
                    var client = new Client();
                    client.findCitiesByPostcode(this.postcodeElement.val(), function (cities) {
                        for (var i in cities) {
                            if (cities[i].name.toLowerCase() == self.cityElement.val().toLowerCase()) {
                                self.setCity(cities[i]);
                                return;
                            }
                        }
                        if (cities.length > 0) {
                            self.setCity(cities[0]);
                        }
                    });
                }
                else {
                    this.setCity(null);
                }
                self.updateAddress();
            };
            AddressAutocomplete.prototype.setCity = function (city) {
                var self = this;
                if (this.streetElement.length) {
                    if (this.city && city) {
                        if (city.id != this.city.id) {
                            this.streetElement.val('');
                        }
                    }
                    this.streetElement.prop('readonly', !city);
                }
                this.houseNumberElement.prop('readonly', !city);
                this.boxNumberElement.prop('readonly', !city);
                this.city = city;
                if (city) {
                    this.cityElement.val(city.name);
                    this.postcodeElement.val(city.postcode);
                    if (this.streetElement.length) {
                        var autocomplete;
                        if (autocomplete = this.streetElement.data('autocomplete')) {
                            autocomplete.dispose();
                        }
                        autocomplete = new StreetAutocomplete(this.endpoint + '/streets', 'name');
                        autocomplete.addParam("postcode", this.city.postcode);
                        autocomplete.onSelectCallback = function (suggestion) {
                            self.setStreet(suggestion.data);
                        };
                        autocomplete.create(this.streetElement);
                        this.streetElement.focus().select();
                    }
                }
                this.updateAddress();
            };
            AddressAutocomplete.prototype.setStreet = function (street) {
                if (street && this.street && street.id == this.street.id) {
                    return;
                }
                this.street = street;
                if (street && this.houseNumberElement.length) {
                    this.houseNumberElement.focus();
                }
                this.updateAddress();
            };
            AddressAutocomplete.prototype.updateAddress = function () {
                this.address = {
                    postcode: this.postcodeElement.val(),
                    city: this.cityElement.val(),
                    street: this.streetElement.val(),
                    house_number: this.houseNumberElement.val(),
                    box: this.boxNumberElement.val()
                };
                if (this.city) {
                    this.addressElement.data('city', this.city);
                }
                if (this.street) {
                    this.addressElement.data('street', this.street);
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
            var elem = $(elem);
            var autocomplete = new Econtract.Toolbox.AddressAutocomplete(options.apiEndpoint);
            autocomplete.postcodeElement = $(options.postcodeSelector, elem);
            autocomplete.cityElement = $(options.citySelector, elem);
            autocomplete.streetElement = $(options.streetSelector, elem);
            autocomplete.houseNumberElement = $(options.houseNumberSelector, elem);
            autocomplete.boxNumberElement = $(options.boxNumberSelector, elem);
            autocomplete.create(elem);
            elem.data('autocomplete', autocomplete);
        });
    };
})(jQuery);
//# sourceMappingURL=econtract-toolbox.js.map