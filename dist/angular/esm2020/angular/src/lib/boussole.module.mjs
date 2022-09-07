import { NgModule } from '@angular/core';
import { FocusDirective } from './directives/focus.directive';
import { FocusSectionDirective } from './directives/focusSection.directive';
import { defaultConfiguration } from '../../../types/Configuration';
import { sn } from '../../../Compass';
import * as i0 from "@angular/core";
export class CompassModule {
    constructor() {
        const globalConfig = defaultConfiguration;
        sn.init();
        sn.set(undefined, globalConfig);
    }
}
CompassModule.ɵfac = function CompassModule_Factory(t) { return new (t || CompassModule)(); };
CompassModule.ɵmod = /*@__PURE__*/ i0.ɵɵdefineNgModule({ type: CompassModule });
CompassModule.ɵinj = /*@__PURE__*/ i0.ɵɵdefineInjector({});
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(CompassModule, [{
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
(function () { (typeof ngJitMode === "undefined" || ngJitMode) && i0.ɵɵsetNgModuleScope(CompassModule, { declarations: [FocusDirective,
        FocusSectionDirective], exports: [FocusDirective,
        FocusSectionDirective] }); })();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYm91c3NvbGUubW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2FuZ3VsYXIvc3JjL2xpYi9ib3Vzc29sZS5tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUN6QyxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sOEJBQThCLENBQUM7QUFDOUQsT0FBTyxFQUFFLHFCQUFxQixFQUFFLE1BQU0scUNBQXFDLENBQUM7QUFDNUUsT0FBTyxFQUFpQixvQkFBb0IsRUFBRSxNQUFNLDhCQUE4QixDQUFDO0FBQ25GLE9BQU8sRUFBRSxFQUFFLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQTs7QUFlckMsTUFBTSxPQUFPLGFBQWE7SUFFeEI7UUFDRSxNQUFNLFlBQVksR0FBRyxvQkFBb0IsQ0FBQztRQUMxQyxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDVixFQUFFLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxZQUE2QixDQUFDLENBQUM7SUFDbkQsQ0FBQzs7MEVBTlUsYUFBYTsrREFBYixhQUFhOzt1RkFBYixhQUFhO2NBWnpCLFFBQVE7ZUFBQztnQkFDUixZQUFZLEVBQUU7b0JBQ1osY0FBYztvQkFDZCxxQkFBcUI7aUJBQ3RCO2dCQUNELE9BQU8sRUFBRSxFQUNSO2dCQUNELE9BQU8sRUFBRTtvQkFDUCxjQUFjO29CQUNkLHFCQUFxQjtpQkFDdEI7YUFDRjs7d0ZBQ1ksYUFBYSxtQkFWdEIsY0FBYztRQUNkLHFCQUFxQixhQUtyQixjQUFjO1FBQ2QscUJBQXFCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTmdNb2R1bGUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IEZvY3VzRGlyZWN0aXZlIH0gZnJvbSAnLi9kaXJlY3RpdmVzL2ZvY3VzLmRpcmVjdGl2ZSc7XG5pbXBvcnQgeyBGb2N1c1NlY3Rpb25EaXJlY3RpdmUgfSBmcm9tICcuL2RpcmVjdGl2ZXMvZm9jdXNTZWN0aW9uLmRpcmVjdGl2ZSc7XG5pbXBvcnQgeyBDb25maWd1cmF0aW9uLCBkZWZhdWx0Q29uZmlndXJhdGlvbiB9IGZyb20gJy4uLy4uLy4uL3R5cGVzL0NvbmZpZ3VyYXRpb24nO1xuaW1wb3J0IHsgc24gfSBmcm9tICcuLi8uLi8uLi9Db21wYXNzJ1xuXG5cbkBOZ01vZHVsZSh7XG4gIGRlY2xhcmF0aW9uczogW1xuICAgIEZvY3VzRGlyZWN0aXZlLFxuICAgIEZvY3VzU2VjdGlvbkRpcmVjdGl2ZVxuICBdLFxuICBpbXBvcnRzOiBbXG4gIF0sXG4gIGV4cG9ydHM6IFtcbiAgICBGb2N1c0RpcmVjdGl2ZSxcbiAgICBGb2N1c1NlY3Rpb25EaXJlY3RpdmVcbiAgXVxufSlcbmV4cG9ydCBjbGFzcyBDb21wYXNzTW9kdWxlIHtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBjb25zdCBnbG9iYWxDb25maWcgPSBkZWZhdWx0Q29uZmlndXJhdGlvbjtcbiAgICBzbi5pbml0KCk7XG4gICAgc24uc2V0KHVuZGVmaW5lZCwgZ2xvYmFsQ29uZmlnIGFzIENvbmZpZ3VyYXRpb24pO1xuICB9XG5cbiB9XG4iXX0=