import { NgModule } from '@angular/core';
import { FocusDirective } from './directives/focus.directive';
import { FocusSectionDirective } from './directives/focusSection.directive';
import { defaultConfiguration } from '../../../types/Configuration';
import { sn } from '../../../SpatialNavigation';
import * as i0 from "@angular/core";
export class BoussoleModule {
    constructor() {
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
                    FocusDirective,
                    FocusSectionDirective
                ],
                imports: [],
                exports: [
                    FocusDirective,
                    FocusSectionDirective
                ]
            }]
    }], function () { return []; }, null); })();
(function () { (typeof ngJitMode === "undefined" || ngJitMode) && i0.ɵɵsetNgModuleScope(BoussoleModule, { declarations: [FocusDirective,
        FocusSectionDirective], exports: [FocusDirective,
        FocusSectionDirective] }); })();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYm91c3NvbGUubW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2FuZ3VsYXIvc3JjL2xpYi9ib3Vzc29sZS5tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUN6QyxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sOEJBQThCLENBQUM7QUFDOUQsT0FBTyxFQUFFLHFCQUFxQixFQUFFLE1BQU0scUNBQXFDLENBQUM7QUFDNUUsT0FBTyxFQUFpQixvQkFBb0IsRUFBRSxNQUFNLDhCQUE4QixDQUFDO0FBQ25GLE9BQU8sRUFBRSxFQUFFLEVBQUUsTUFBTSw0QkFBNEIsQ0FBQTs7QUFlL0MsTUFBTSxPQUFPLGNBQWM7SUFFekI7UUFDRSxNQUFNLFlBQVksR0FBRyxvQkFBb0IsQ0FBQztRQUMxQyxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDVixFQUFFLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxZQUE2QixDQUFDLENBQUM7SUFDbkQsQ0FBQzs7NEVBTlUsY0FBYztnRUFBZCxjQUFjOzt1RkFBZCxjQUFjO2NBWjFCLFFBQVE7ZUFBQztnQkFDUixZQUFZLEVBQUU7b0JBQ1osY0FBYztvQkFDZCxxQkFBcUI7aUJBQ3RCO2dCQUNELE9BQU8sRUFBRSxFQUNSO2dCQUNELE9BQU8sRUFBRTtvQkFDUCxjQUFjO29CQUNkLHFCQUFxQjtpQkFDdEI7YUFDRjs7d0ZBQ1ksY0FBYyxtQkFWdkIsY0FBYztRQUNkLHFCQUFxQixhQUtyQixjQUFjO1FBQ2QscUJBQXFCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTmdNb2R1bGUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IEZvY3VzRGlyZWN0aXZlIH0gZnJvbSAnLi9kaXJlY3RpdmVzL2ZvY3VzLmRpcmVjdGl2ZSc7XG5pbXBvcnQgeyBGb2N1c1NlY3Rpb25EaXJlY3RpdmUgfSBmcm9tICcuL2RpcmVjdGl2ZXMvZm9jdXNTZWN0aW9uLmRpcmVjdGl2ZSc7XG5pbXBvcnQgeyBDb25maWd1cmF0aW9uLCBkZWZhdWx0Q29uZmlndXJhdGlvbiB9IGZyb20gJy4uLy4uLy4uL3R5cGVzL0NvbmZpZ3VyYXRpb24nO1xuaW1wb3J0IHsgc24gfSBmcm9tICcuLi8uLi8uLi9TcGF0aWFsTmF2aWdhdGlvbidcblxuXG5ATmdNb2R1bGUoe1xuICBkZWNsYXJhdGlvbnM6IFtcbiAgICBGb2N1c0RpcmVjdGl2ZSxcbiAgICBGb2N1c1NlY3Rpb25EaXJlY3RpdmVcbiAgXSxcbiAgaW1wb3J0czogW1xuICBdLFxuICBleHBvcnRzOiBbXG4gICAgRm9jdXNEaXJlY3RpdmUsXG4gICAgRm9jdXNTZWN0aW9uRGlyZWN0aXZlXG4gIF1cbn0pXG5leHBvcnQgY2xhc3MgQm91c3NvbGVNb2R1bGUge1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIGNvbnN0IGdsb2JhbENvbmZpZyA9IGRlZmF1bHRDb25maWd1cmF0aW9uO1xuICAgIHNuLmluaXQoKTtcbiAgICBzbi5zZXQodW5kZWZpbmVkLCBnbG9iYWxDb25maWcgYXMgQ29uZmlndXJhdGlvbik7XG4gIH1cblxuIH1cbiJdfQ==