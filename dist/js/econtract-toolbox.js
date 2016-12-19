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
            delay: 0,
        };
        Toolbox.AddressConfig = {
            postcodeSelector: ".postcode",
            citySelector: ".city",
            streetSelector: ".street",
            houseNumberSelector: ".house-number",
            boxNumberSelector: ".box-number",
        };
        Toolbox.EanConfig = {
            addressSelector: ".address",
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
            Client.prototype.findAddresses = function (address, callback) {
                this.get('/addresses', {
                    postcode: address.postcode,
                    city: address.city,
                    street: address.street,
                    house_number: address.house_number,
                    box: address.box
                })
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
            Client.prototype.findConnectionsByAddressId = function (addressId, callback) {
                this.get('/connections', { address_id: addressId })
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
                if (paramName === void 0) { paramName = "name"; }
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
                if (this.element) {
                    throw new Error("Autocomplete already created");
                }
                this.element = input;
                var self = this;
                var createMatcher = function (q, flags) {
                    q = '(\\b|^)(' + $.Autocomplete.utils.escapeRegExChars(q) + ')';
                    q = q.replace(/[eéèêëEÉÈÊË]/i, '[eéèêëEÉÈÊË]');
                    q = q.replace(/[aàâäAÀÁÂÃÄÅÆ]/i, '[aàâäAÀÁÂÃÄÅÆ]');
                    q = q.replace(/[cçC]/i, '[cçC]');
                    q = q.replace(/[iïîIÌÍÎÏ]/i, '[iïîIÌÍÎÏ]');
                    q = q.replace(/[oôöÒÓÔÕÖ]/i, '[oôöÒÓÔÕÖ]');
                    q = q.replace(/[uüûUÜÛÙÚ]/i, '[uüûUÜÛÙÚ]');
                    q = q.replace(/[yYÿÝ]/i, '[yYÿÝ]');
                    return new RegExp(q, flags);
                };
                var autocompleteLookup = function (suggestion, originalQuery, queryLowerCase) {
                    return suggestion.value.toLowerCase().match(createMatcher(queryLowerCase, 'gi'));
                };
                var autocompleteFormatResult = function (suggestion, currentValue) {
                    return suggestion.value.replace(createMatcher(currentValue, 'gi'), '<strong>$1$2<\/strong>');
                };
                return this.internalAutocomplete = input.devbridgeAutocomplete({
                    autoSelectFirst: true,
                    paramName: this.paramName,
                    serviceUrl: this.endpoint,
                    dataType: 'json',
                    deferRequestBy: this.delay,
                    transformResult: this.transformResultCallback,
                    onSelect: function (suggestion) {
                        self.element.trigger('selected', [suggestion.data]);
                    },
                    params: self.params,
                    minChars: this.minChars,
                    lookupFilter: autocompleteLookup,
                    formatResult: autocompleteFormatResult,
                });
            };
            return Autocomplete;
        }());
        var CityAutocomplete = (function (_super) {
            __extends(CityAutocomplete, _super);
            function CityAutocomplete() {
                _super.apply(this, arguments);
                this.minChars = 2;
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
        var EanAutocomplete = (function (_super) {
            __extends(EanAutocomplete, _super);
            function EanAutocomplete(endpoint) {
                _super.call(this, endpoint + '/connections', 'ean');
                this.minChars = 0;
                this.autocompleted = false;
                this.suggestions = [];
                this.transformResultCallback = function (response) {
                    return {
                        suggestions: $.map(response, function (item) {
                            return { value: item.ean, data: item };
                        })
                    };
                };
            }
            EanAutocomplete.prototype.create = function (input) {
                var api = _super.prototype.create.call(this, input);
                var self = this;
                var timeout;
                var suggestions = [];
                api.autocomplete('setOptions', {
                    lookup: function (query, done) {
                        done({
                            suggestions: self.suggestions
                        });
                    },
                });
                this.element.on('change', function () {
                    self.autocompleted = false;
                });
                this.addressElement.on('changed', function (event, address) {
                    for (var i in address) {
                        if (!address[i]) {
                            delete address[i];
                        }
                    }
                    if (timeout) {
                        clearTimeout(timeout);
                    }
                    timeout = setTimeout(function () {
                        var client = new Client();
                        client.findAddresses(address, function (addresses) {
                            if (addresses.length > 0) {
                                client.findConnectionsByAddressId(addresses[0].id, function (connections) {
                                    if (connections.length == 1) {
                                        self.element.val(connections[0].ean);
                                        self.autocompleted = true;
                                    }
                                    else if (self.autocompleted) {
                                        self.element.val('');
                                    }
                                    self.suggestions = $.map(connections, function (item) {
                                        return { value: item.ean.toString(), data: item };
                                    });
                                });
                            }
                            else if (self.autocompleted) {
                                self.element.val('');
                            }
                        });
                    }, 200);
                });
                return api;
            };
            return EanAutocomplete;
        }(Autocomplete));
        Toolbox.EanAutocomplete = EanAutocomplete;
        var AddressAutocomplete = (function () {
            function AddressAutocomplete(endpoint) {
                this.address = {};
                this.endpoint = endpoint ? endpoint : Toolbox.Config.apiEndpoint;
            }
            AddressAutocomplete.prototype.create = function (input) {
                var self = this;
                this.addressElement = $(input);
                if (this.postcodeElement.length) {
                    var postcodeAutocomplete = new CityAutocomplete(this.endpoint + '/cities', 'postcode');
                    postcodeAutocomplete.create(this.postcodeElement);
                    this.postcodeElement.on('selected', function (event, suggestion) {
                        self.setCity(suggestion);
                    });
                }
                if (this.cityElement.length) {
                    var cityAutocomplete = new CityAutocomplete(this.endpoint + '/cities', 'name');
                    cityAutocomplete.create(this.cityElement);
                    this.cityElement.on('selected', function (event, suggestion) {
                        self.setCity(suggestion);
                    });
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
                        self.loading = true;
                        for (var i in cities) {
                            if (cities[i].name.toLowerCase() == self.cityElement.val().toLowerCase()) {
                                self.setCity(cities[i]);
                                break;
                            }
                        }
                        if (cities.length > 0) {
                            self.setCity(cities[0]);
                        }
                        self.loading = false;
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
                        autocomplete.create(this.streetElement);
                        this.streetElement.on('selected', function (event, suggestion) {
                            self.setStreet(suggestion);
                        });
                        if (!this.loading) {
                            this.streetElement.focus().select();
                        }
                    }
                }
                this.updateAddress();
            };
            AddressAutocomplete.prototype.setStreet = function (street) {
                if (street && this.street && street.id == this.street.id) {
                    return;
                }
                this.street = street;
                if (street && this.houseNumberElement.length && !this.loading) {
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
                this.addressElement.trigger('changed', [this.address]);
            };
            return AddressAutocomplete;
        }());
        Toolbox.AddressAutocomplete = AddressAutocomplete;
    })(Toolbox = Econtract.Toolbox || (Econtract.Toolbox = {}));
})(Econtract || (Econtract = {}));
(function ($) {
    $.fn.addressAutocomplete = function (options) {
        $(this).each(function (i, elem) {
            options = $.extend(Econtract.Toolbox.Config, Econtract.Toolbox.AddressConfig, options);
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
    $.fn.eanAutocomplete = function (options) {
        $(this).each(function (i, elem) {
            options = $.extend(Econtract.Toolbox.Config, Econtract.Toolbox.EanConfig, options);
            var elem = $(elem);
            var autocomplete = new Econtract.Toolbox.EanAutocomplete(options.apiEndpoint);
            autocomplete.addressElement = $(options.addressSelector, elem);
            if (autocomplete.addressElement.length == 0) {
                autocomplete.addressElement = $(options.addressSelector);
            }
            autocomplete.create(elem);
            elem.data('autocomplete', autocomplete);
        });
    };
})(jQuery);
//# sourceMappingURL=econtract-toolbox.js.map