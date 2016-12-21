/// <reference path="../typings/index.d.ts" />
/// <reference path="../bower_components/devbridge-autocomplete/typings/jquery-autocomplete/jquery.autocomplete.d.ts" />

namespace Econtract {
    export namespace Toolbox {
        export var Config:AutocompleteOptions = {
            apiEndpoint: '',                      // Toolbox API endpoint
            apiKey: '',                           // Toolbox API key
            delay: 0,                             // Delay autocomplete requests by this amount of miliseconds
        };
        export var AddressConfig:AddressAutocompleteOptions = {
            postcodeSelector: ".postcode",        // Postcode field selector (relative to address container)
            citySelector: ".city",                // City field selector (relative to address container)
            streetSelector: ".street",            // Street field selector (relative to address container)
            houseNumberSelector: ".house-number", // Street field selector (relative to address container)
            boxNumberSelector: ".box-number",     // Street field selector (relative to address container)
        };
        export var EanConfig:EanAutocompleteOptions = {
            addressSelector: ".address",        // Absolute address container selector
            energyType: null
        };

        interface Address {
            id:number,
            city:string;
            postcode:number;
            street:string;
            house_number:string;
            box:string;
        }
        interface Street {
            id:number;
            name:string;
            city:string;
            postcode:number;
        }
        interface City {
            id:number;
            name:string;
            postcode:number;
        }

        export interface AddressAutocompleteOptions extends AutocompleteOptions {
            apiEndpoint : string;
            apiKey: string,
            postcodeSelector : string;
            citySelector : string;
            streetSelector : string;
            houseNumberSelector : string;
            boxNumberSelector : string;
            delay: number;
        }
        export interface EanAutocompleteOptions extends AutocompleteOptions {
            addressSelector : string
        }

        export class Client {
            private endpoint:string;

            constructor(endpoint?:string) {
                this.endpoint = endpoint ? endpoint : Config.apiEndpoint;
            }

            public get(uri:string, query: {}) {
                return $.get(
                    this.endpoint + uri,
                    $.extend({toolbox_key: Config.apiKey}, query)
                );
            }

            public findOneCityByPostcode(postcode:number, callback:void) {
                this.get('/cities', {postcode: postcode})
                    .success(function (response) {
                        if (response.length) {
                            callback(response[0]);
                        } else {
                            callback(null);
                        }
                    }).error(function () {
                        callback(null);
                    })
            }

            public findCitiesByPostcode(postcode:number, callback:void) {
                this.get('/cities', { postcode: postcode })
                    .success(function (response) {
                        if (response.length) {
                            callback(response);
                        } else {
                            callback([]);
                        }
                    }).error(function () {
                        callback([]);
                    });
            }

            public findAddresses(address:Address, callback:void) {
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
                        } else {
                            callback([]);
                        }
                    }).error(function () {
                        callback([]);
                    });
            }
            public findConnectionsByAddressId(addressId, energyType, callback:void) {
                this.get('/connections', { address_id: addressId })
                    .success(function (response) {
                        if (response.length) {
                            var connections = [];
                            for (var i in response) {
                                var connection = response[i];
                                if (energyType && connection.type == energyType) {
                                    connections.push(connection);
                                }
                            }
                            callback(connections);
                        } else {
                            callback([]);
                        }
                    }).error(function () {
                        callback([]);
                    });
            }
        }

        class Autocomplete {
            public element:jQuery;
            public paramName:string;
            public transformResultCallback;
            public endpoint:string;
            private params:any = {};
            public delay:number = Config.delay;
            public minChars:number = 1;
            protected internalAutocomplete;

            constructor(endpoint:string, paramName:string = "name") {
                this.paramName = paramName;
                this.endpoint = endpoint;
                this.params = {
                    toolbox_key: Config.apiKey
                }
            }

            public addParam(name: string, value: any) {
                this.params[name] = value;
            }

            public create(input:JQuery) {
                if (this.element) {
                    throw new Error("Autocomplete already created");
                }
                this.element = input;
                var self = this;

                var createMatcher = function(q, flags) {
                    q = '(\\b|^)('+$.Autocomplete.utils.escapeRegExChars(q)+')';
                    q = q.replace(/[eéèêëEÉÈÊË]/i,'[eéèêëEÉÈÊË]');
                    q = q.replace(/[aàâäAÀÁÂÃÄÅÆ]/i,'[aàâäAÀÁÂÃÄÅÆ]');
                    q = q.replace(/[cçC]/i,'[cçC]');
                    q = q.replace(/[iïîIÌÍÎÏ]/i,'[iïîIÌÍÎÏ]');
                    q = q.replace(/[oôöÒÓÔÕÖ]/i,'[oôöÒÓÔÕÖ]');
                    q = q.replace(/[uüûUÜÛÙÚ]/i,'[uüûUÜÛÙÚ]');
                    q = q.replace(/[yYÿÝ]/i,'[yYÿÝ]');

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
            }
        }

        class CityAutocomplete extends Autocomplete {
            public minChars:number = 2;
            public transformResultCallback = function (response) {
                return {
                    suggestions: $.map(response, function (item) {
                        return {value: item.postcode + ' - ' + item.name, data: item};
                    })
                }
            };
        }

        class StreetAutocomplete extends Autocomplete {
            public minChars:number = 3;
            public transformResultCallback = function (response) {
                return {
                    suggestions: $.map(response, function (item) {
                        return {value: item.name, data: item};
                    })
                }
            };
        }

        export class EanAutocomplete {
            private addressElement:JQuery;
            private autocompleted:boolean = false;
            private suggestions:Array = [];

            constructor(input:JQuery, addressElement:JQuery, energyType) {
                this.energyType = energyType;
                this.addressElement = addressElement;
                this.element = input;
                var self = this;
                var timeout;
                var suggestions = [];

                this.element.on('change', function () {
                    self.autocompleted = false;
                });

                this.addressElement.on('changed', function (event, address:Address) {
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
                            if (addresses.length == 1) {
                                client.findConnectionsByAddressId(addresses[0].id, self.energyType, function (connections) {
                                    if (connections.length == 1) {
                                        self.element.val(connections[0].ean);
                                        self.autocompleted = true;
                                    } else if (self.autocompleted) {
                                        self.element.val('');
                                    }
                                    self.suggestions = $.map(connections, function (item) {
                                        return {value: item.ean.toString(), data: item};
                                    });
                                });
                            } else if (self.autocompleted) {
                                self.element.val('');
                            }
                        });
                    }, 200);
                });
            }
        }

        export class AddressAutocomplete {
            private endpoint:string;
            private city:City;
            private street:Street;
            private address:Address = {};
            private postcodeElement:JQuery;
            private cityElement:JQuery;
            private streetElement:JQuery;
            private houseNumberElement:JQuery;
            private boxNumberElement:JQuery;
            private addressElement:JQuery;
            private loading:boolean;

            constructor(endpoint?:string) {
                this.endpoint = endpoint ? endpoint : Config.apiEndpoint;
            }

            public create(input:JQuery):void {
                var self = this;
                this.addressElement = $(input);

                if (this.postcodeElement.length) {
                    var postcodeAutocomplete = new CityAutocomplete(this.endpoint + '/cities', 'postcode');
                    postcodeAutocomplete.create(this.postcodeElement);
                    this.postcodeElement.on('selected', function (event, suggestion) {
                        self.setCity(suggestion);
                    })
                }

                if (this.cityElement.length) {
                    var cityAutocomplete = new CityAutocomplete(this.endpoint + '/cities', 'name');
                    cityAutocomplete.create(this.cityElement);
                    this.cityElement.on('selected', function (event, suggestion) {
                        self.setCity(suggestion);
                    })
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
                } else {
                    this.setCity(null);
                }

                self.updateAddress();
            }

            public setCity(city:City) {
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
            }

            public setStreet(street:Street) {
                if (street && this.street && street.id == this.street.id) {
                    return;
                }
                this.street = street;
                if (street && this.houseNumberElement.length && !this.loading) {
                    this.houseNumberElement.focus();
                }
                this.updateAddress();
            }

            public updateAddress() {
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
            }
        }
    }
}

(function ($) {
    $.fn.addressAutocomplete = function (options:Econtract.Toolbox.AddressAutocompleteOptions) {
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

    $.fn.eanAutocomplete = function (options:Econtract.Toolbox.EanAutocompleteOptions) {
        $(this).each(function (i, elem) {
            options = $.extend(Econtract.Toolbox.Config, Econtract.Toolbox.EanConfig, options);

            var elem = $(elem);
            if (!options.energyType) {
                throw new Error("Option 'energyType' is required");
            }
            var addressElement = $(options.addressSelector);
            if (addressElement.length == 0) {
                throw new Error("Address not found using selector '" + options.addressSelector + "'");
            }

            var autocomplete = new Econtract.Toolbox.EanAutocomplete(elem, addressElement, options.energyType);

            elem.data('autocomplete', autocomplete);
        });
    }
})(jQuery);

