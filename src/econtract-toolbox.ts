/// <reference path="../typings/index.d.ts" />
/// <reference path="../bower_components/devbridge-autocomplete/typings/jquery-autocomplete/jquery.autocomplete.d.ts" />

namespace Econtract {
    export namespace Toolbox {
        export var Config:AddressAutocompleteOptions = {
            apiEndpoint: '',                      // Toolbox API endpoint
            apiKey: '',                           // Toolbox API key
            postcodeSelector: ".postcode",        // Postcode field selector (relative to address container)
            citySelector: ".city",                // City field selector (relative to address container)
            streetSelector: ".street",            // Street field selector (relative to address container)
            houseNumberSelector: ".house-number", // Street field selector (relative to address container)
            boxNumberSelector: ".box-number",     // Street field selector (relative to address container)
            delay: 0,                             // Delay autocomplete requests by this amount of miliseconds
        };

        interface Address {
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

        export interface AddressAutocompleteOptions {
            apiEndpoint : string;
            apiKey: string,
            postcodeSelector : string;
            citySelector : string;
            streetSelector : string;
            houseNumberSelector : string;
            boxNumberSelector : string;
            delay: number;
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
        }

        class Autocomplete {
            public paramName:string;
            public transformResultCallback;
            public onSelectCallback;
            public endpoint:string;
            private params:any = {};
            public delay:number = Config.delay;
            public minChars:number = 1;

            constructor(endpoint:string, paramName:string) {
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

                return input.devbridgeAutocomplete({
                    autoSelectFirst: true,
                    paramName: this.paramName,
                    serviceUrl: this.endpoint,
                    dataType: 'json',
                    deferRequestBy: this.delay,
                    transformResult: this.transformResultCallback,
                    onSelect: this.onSelectCallback,
                    params: this.params,
                    minChars: this.minChars,
                    lookupFilter: autocompleteLookup,
                    formatResult: autocompleteFormatResult,
                });
            }
        }

        class CityAutocomplete extends Autocomplete {
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

            constructor(endpoint?:string) {
                this.endpoint = endpoint ? endpoint : Config.apiEndpoint;
            }

            public create(input:JQuery):void {
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
                        autocomplete.onSelectCallback = function (suggestion) {
                            self.setStreet(suggestion.data);
                        };
                        autocomplete.create(this.streetElement);
                        this.streetElement.focus().select();
                    }
                }
                this.updateAddress();
            }

            public setStreet(street:Street) {
                if (street && this.street && street.id == this.street.id) {
                    return;
                }
                this.street = street;
                if (street && this.houseNumberElement.length) {
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
            }
        }
    }
}

(function ($) {
    $.fn.addressAutocomplete = function (options:Econtract.Toolbox.AddressAutocompleteOptions) {
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

