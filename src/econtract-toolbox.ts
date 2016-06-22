/// <reference path="../typings/index.d.ts" />
/// <reference path="../bower_components/devbridge-autocomplete/typings/jquery-autocomplete/jquery.autocomplete.d.ts" />

namespace Econtract {
    export namespace Toolbox {
        export var Config = {
            apiEndpoint: '', // Toolbox API endpoint
            postcodeSelector: ".postcode", // Postcode field selector (relative to address container)
            citySelector: ".city", // City field selector (relative to address container)
            streetSelector: ".street", // Street field selector (relative to address container)
            delay: 0, // Delay autocomplete requests by this amount of miliseconds
        };

        interface Address {
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
            postcodeSelector : string;
            citySelector : string;
            streetSelector : string;
        }

        export class Client {
            private endpoint:string;

            constructor(endpoint?:string) {
                this.endpoint = endpoint ? endpoint : Config.apiEndpoint;
            }

            public findOneCityByPostcode(postcode:number, callback) {
                $.get(this.endpoint + '/cities', {postcode: postcode})
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
        }

        class Autocomplete {
            public paramName:string;
            public transformResultCallback;
            public onSelectCallback;
            public endpoint:string;
            public params:any;
            public delay:number = Config.delay;
            public minChars:number = 1;

            constructor(endpoint:string, paramName:string) {
                this.paramName = paramName;
                this.endpoint = endpoint;
            }

            public create(input:JQuery) {
                return input.devbridgeAutocomplete({
                    autoSelectFirst: true,
                    paramName: this.paramName,
                    serviceUrl: this.endpoint,
                    dataType: 'json',
                    deferRequestBy: this.delay,
                    transformResult: this.transformResultCallback,
                    onSelect: this.onSelectCallback,
                    params: this.params ? this.params : {},
                    minChars: this.minChars
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

        export class AddressAutocomplete {
            private endpoint:string;
            private city:City;
            public postcodeElement:JQuery;
            public cityElement:JQuery;
            public streetElement:JQuery;

            constructor(endpoint?:string) {
                this.endpoint = endpoint ? endpoint : Config.apiEndpoint;
            }

            public create(input:JQuery):void {
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
                    client.findOneCityByPostcode(this.postcodeElement.val(), function (city:City) {
                        self.setCity(city);
                    });
                } else {
                    this.setCity(null);
                }
            }

            private static streetTransformResultCallback(response) {
                return {
                    suggestions: $.map(response, function (item) {
                        return {value: item.name, data: item};
                    })
                }
            }

            public setCity(city:City) {
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
                        autocomplete.params = {"city_id": this.city.id};
                        autocomplete.create(this.streetElement);
                        this.streetElement.focus();
                    }
                }
            }
        }
    }
}

(function ($) {
    $.fn.addressAutocomplete = function (options:Econtract.Toolbox.AddressAutocompleteOptions) {
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

