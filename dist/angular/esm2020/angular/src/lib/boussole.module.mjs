import { NgModule } from '@angular/core';
import { BoussoleComponent } from './boussole.component';
import { FocusDirective } from './directives/focus.directive';
import { FocusSectionDirective } from './directives/focusSection.directive';
import { defaultConfiguration } from '../../../types/Configuration';
import { sn } from '../../../SpatialNavigation';
import * as i0 from "@angular/core";
export class BoussoleModule {
    constructor() {
        console.log('boussole module constructor');
        const globalConfig = defaultConfiguration;
        sn.init();
        sn.set(undefined, globalConfig);
    }
}
BoussoleModule.ɵfac = function BoussoleModule_Factory(t) { return new (t || BoussoleModule)(); };
BoussoleModule.ɵmod = /*@__PURE__*/ i0.ɵɵdefineNgModule({ type: BoussoleModule });
BoussoleModule.ɵinj = /*@__PURE__*/ i0.ɵɵdefineInjector({});
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(BoussoleModule, [{
        type: NgModule,
        args: [{
                declarations: [
                    BoussoleComponent,
                    FocusDirective,
                    FocusSectionDirective
                ],
                imports: [],
                exports: [
                    BoussoleComponent,
                    FocusDirective,
                    FocusSectionDirective
                ]
            }]
    }], function () { return []; }, null); })();
(function () { (typeof ngJitMode === "undefined" || ngJitMode) && i0.ɵɵsetNgModuleScope(BoussoleModule, { declarations: [BoussoleComponent,
        FocusDirective,
        FocusSectionDirective], exports: [BoussoleComponent,
        FocusDirective,
        FocusSectionDirective] }); })();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYm91c3NvbGUubW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2FuZ3VsYXIvc3JjL2xpYi9ib3Vzc29sZS5tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUN6QyxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQUN6RCxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sOEJBQThCLENBQUM7QUFDOUQsT0FBTyxFQUFFLHFCQUFxQixFQUFFLE1BQU0scUNBQXFDLENBQUM7QUFDNUUsT0FBTyxFQUFpQixvQkFBb0IsRUFBRSxNQUFNLDhCQUE4QixDQUFDO0FBQ25GLE9BQU8sRUFBRSxFQUFFLEVBQUUsTUFBTSw0QkFBNEIsQ0FBQTs7QUFpQi9DLE1BQU0sT0FBTyxjQUFjO0lBRXpCO1FBQ0UsT0FBTyxDQUFDLEdBQUcsQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO1FBQzNDLE1BQU0sWUFBWSxHQUFHLG9CQUFvQixDQUFDO1FBQzFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNWLEVBQUUsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLFlBQTZCLENBQUMsQ0FBQztJQUNuRCxDQUFDOzs0RUFQVSxjQUFjO2dFQUFkLGNBQWM7O3VGQUFkLGNBQWM7Y0FkMUIsUUFBUTtlQUFDO2dCQUNSLFlBQVksRUFBRTtvQkFDWixpQkFBaUI7b0JBQ2pCLGNBQWM7b0JBQ2QscUJBQXFCO2lCQUN0QjtnQkFDRCxPQUFPLEVBQUUsRUFDUjtnQkFDRCxPQUFPLEVBQUU7b0JBQ1AsaUJBQWlCO29CQUNqQixjQUFjO29CQUNkLHFCQUFxQjtpQkFDdEI7YUFDRjs7d0ZBQ1ksY0FBYyxtQkFadkIsaUJBQWlCO1FBQ2pCLGNBQWM7UUFDZCxxQkFBcUIsYUFLckIsaUJBQWlCO1FBQ2pCLGNBQWM7UUFDZCxxQkFBcUIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOZ01vZHVsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgQm91c3NvbGVDb21wb25lbnQgfSBmcm9tICcuL2JvdXNzb2xlLmNvbXBvbmVudCc7XG5pbXBvcnQgeyBGb2N1c0RpcmVjdGl2ZSB9IGZyb20gJy4vZGlyZWN0aXZlcy9mb2N1cy5kaXJlY3RpdmUnO1xuaW1wb3J0IHsgRm9jdXNTZWN0aW9uRGlyZWN0aXZlIH0gZnJvbSAnLi9kaXJlY3RpdmVzL2ZvY3VzU2VjdGlvbi5kaXJlY3RpdmUnO1xuaW1wb3J0IHsgQ29uZmlndXJhdGlvbiwgZGVmYXVsdENvbmZpZ3VyYXRpb24gfSBmcm9tICcuLi8uLi8uLi90eXBlcy9Db25maWd1cmF0aW9uJztcbmltcG9ydCB7IHNuIH0gZnJvbSAnLi4vLi4vLi4vU3BhdGlhbE5hdmlnYXRpb24nXG5cblxuQE5nTW9kdWxlKHtcbiAgZGVjbGFyYXRpb25zOiBbXG4gICAgQm91c3NvbGVDb21wb25lbnQsXG4gICAgRm9jdXNEaXJlY3RpdmUsXG4gICAgRm9jdXNTZWN0aW9uRGlyZWN0aXZlXG4gIF0sXG4gIGltcG9ydHM6IFtcbiAgXSxcbiAgZXhwb3J0czogW1xuICAgIEJvdXNzb2xlQ29tcG9uZW50LFxuICAgIEZvY3VzRGlyZWN0aXZlLFxuICAgIEZvY3VzU2VjdGlvbkRpcmVjdGl2ZVxuICBdXG59KVxuZXhwb3J0IGNsYXNzIEJvdXNzb2xlTW9kdWxlIHtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBjb25zb2xlLmxvZygnYm91c3NvbGUgbW9kdWxlIGNvbnN0cnVjdG9yJyk7XG4gICAgY29uc3QgZ2xvYmFsQ29uZmlnID0gZGVmYXVsdENvbmZpZ3VyYXRpb247XG4gICAgc24uaW5pdCgpO1xuICAgIHNuLnNldCh1bmRlZmluZWQsIGdsb2JhbENvbmZpZyBhcyBDb25maWd1cmF0aW9uKTtcbiAgfVxuXG4gfVxuIl19