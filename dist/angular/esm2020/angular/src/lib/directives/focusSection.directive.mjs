import { Directive, Input } from '@angular/core';
import { sn } from '../../../../Compass';
import { defaultConfiguration } from '../../../../types/Configuration';
import * as i0 from "@angular/core";
export class FocusSectionDirective {
    constructor(el) {
        this.el = el;
        this.element = undefined;
        this.focusSection = {};
        this.assignConfig = (sectionId, config) => {
            const globalConfig = defaultConfiguration; // TO DO : integrate app.globalConfig given by developer
            const sectionConfig = ({ ...globalConfig });
            if (config) {
                Object.assign(sectionConfig, config);
            }
            sectionConfig.selector = `[data-section-id="${sectionId}"] [data-focusable=true]`;
            return sectionConfig;
        };
        this.element = el.nativeElement;
    }
    ngOnInit() {
        let sectionId = null;
        if (this.focusSection && this.focusSection.id && this.focusSection.conf) {
            sectionId = this.focusSection.id;
            const config = this.focusSection.conf;
            config.element = this.el.nativeElement;
            try {
                sn.add(sectionId, config);
            }
            catch (error) { }
        }
        else {
            sectionId = sn.add(undefined, defaultConfiguration);
        }
        // set sectionid to data set for removing when unbinding
        this.el.nativeElement.dataset.sectionId = sectionId;
        if (this.focusSection.conf) {
            sn.set(sectionId, this.assignConfig(sectionId, this.focusSection.conf));
        }
        // set default section
        // if (this.focusSection.modifiers.default) {
        // sn.setDefaultSection(sectionId);
        //   }
    }
}
FocusSectionDirective.ɵfac = function FocusSectionDirective_Factory(t) { return new (t || FocusSectionDirective)(i0.ɵɵdirectiveInject(i0.ElementRef)); };
FocusSectionDirective.ɵdir = /*@__PURE__*/ i0.ɵɵdefineDirective({ type: FocusSectionDirective, selectors: [["", "focusSection", ""]], inputs: { focusSection: "focusSection" } });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(FocusSectionDirective, [{
        type: Directive,
        args: [{
                selector: '[focusSection]'
            }]
    }], function () { return [{ type: i0.ElementRef }]; }, { focusSection: [{
            type: Input
        }] }); })();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9jdXNTZWN0aW9uLmRpcmVjdGl2ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9hbmd1bGFyL3NyYy9saWIvZGlyZWN0aXZlcy9mb2N1c1NlY3Rpb24uZGlyZWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxTQUFTLEVBQWMsS0FBSyxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQzdELE9BQU8sRUFBRSxFQUFFLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQTtBQUN4QyxPQUFPLEVBQWlCLG9CQUFvQixFQUFFLE1BQU0saUNBQWlDLENBQUE7O0FBU3JGLE1BQU0sT0FBTyxxQkFBcUI7SUFlaEMsWUFBb0IsRUFBYztRQUFkLE9BQUUsR0FBRixFQUFFLENBQVk7UUFkbEMsWUFBTyxHQUE0QixTQUFTLENBQUM7UUFDcEMsaUJBQVksR0FBcUIsRUFBRSxDQUFDO1FBRXJDLGlCQUFZLEdBQUcsQ0FBQyxTQUE2QixFQUFFLE1BQXFCLEVBQWlCLEVBQUU7WUFDN0YsTUFBTSxZQUFZLEdBQUcsb0JBQW9CLENBQUMsQ0FBQyx3REFBd0Q7WUFDbkcsTUFBTSxhQUFhLEdBQUcsQ0FBQyxFQUFFLEdBQUcsWUFBWSxFQUFFLENBQWtCLENBQUM7WUFDN0QsSUFBSSxNQUFNLEVBQUU7Z0JBQ1YsTUFBTSxDQUFDLE1BQU0sQ0FBQyxhQUFhLEVBQUUsTUFBTSxDQUFDLENBQUM7YUFDdEM7WUFDRCxhQUFhLENBQUMsUUFBUSxHQUFHLHFCQUFxQixTQUFTLDBCQUEwQixDQUFDO1lBQ2xGLE9BQU8sYUFBYSxDQUFDO1FBQ3ZCLENBQUMsQ0FBQztRQUlBLElBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDLGFBQWEsQ0FBQztJQUNsQyxDQUFDO0lBRUQsUUFBUTtRQUNOLElBQUksU0FBUyxHQUFHLElBQUksQ0FBQztRQUVyQixJQUFJLElBQUksQ0FBQyxZQUFZLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUU7WUFDdkUsU0FBUyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDO1lBQ2pDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBcUIsQ0FBQztZQUN2RCxNQUFNLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsYUFBYSxDQUFDO1lBQ3ZDLElBQUk7Z0JBQ0YsRUFBRSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLENBQUM7YUFDM0I7WUFBQyxPQUFPLEtBQUssRUFBRSxHQUFFO1NBQ25CO2FBQU07WUFDTCxTQUFTLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztTQUNyRDtRQUVELHdEQUF3RDtRQUN4RCxJQUFJLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztRQUNwRCxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFO1lBQzFCLEVBQUUsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztTQUN6RTtRQUNELHNCQUFzQjtRQUN0Qiw2Q0FBNkM7UUFDN0MsbUNBQW1DO1FBQ25DLE1BQU07SUFDUixDQUFDOzswRkExQ1UscUJBQXFCO3dFQUFyQixxQkFBcUI7dUZBQXJCLHFCQUFxQjtjQUhqQyxTQUFTO2VBQUM7Z0JBQ1QsUUFBUSxFQUFFLGdCQUFnQjthQUMzQjs2REFHVSxZQUFZO2tCQUFwQixLQUFLIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRGlyZWN0aXZlLCBFbGVtZW50UmVmLCBJbnB1dCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgc24gfSBmcm9tICcuLi8uLi8uLi8uLi9Db21wYXNzJ1xuaW1wb3J0IHsgQ29uZmlndXJhdGlvbiwgZGVmYXVsdENvbmZpZ3VyYXRpb24gfSBmcm9tICcuLi8uLi8uLi8uLi90eXBlcy9Db25maWd1cmF0aW9uJ1xuXG5pbnRlcmZhY2UgU2VjdGlvbkRpcmVjdGl2ZSB7XG4gIGlkPzogc3RyaW5nO1xuICBjb25mPzogQ29uZmlndXJhdGlvblxufVxuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2ZvY3VzU2VjdGlvbl0nXG59KVxuZXhwb3J0IGNsYXNzIEZvY3VzU2VjdGlvbkRpcmVjdGl2ZSB7XG4gIGVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICBASW5wdXQoKSBmb2N1c1NlY3Rpb246IFNlY3Rpb25EaXJlY3RpdmUgPSB7fTtcblxuICBwcml2YXRlIGFzc2lnbkNvbmZpZyA9IChzZWN0aW9uSWQ6IHN0cmluZyB8IHVuZGVmaW5lZCwgY29uZmlnOiBDb25maWd1cmF0aW9uKTogQ29uZmlndXJhdGlvbiA9PiB7XG4gICAgY29uc3QgZ2xvYmFsQ29uZmlnID0gZGVmYXVsdENvbmZpZ3VyYXRpb247IC8vIFRPIERPIDogaW50ZWdyYXRlIGFwcC5nbG9iYWxDb25maWcgZ2l2ZW4gYnkgZGV2ZWxvcGVyXG4gICAgY29uc3Qgc2VjdGlvbkNvbmZpZyA9ICh7IC4uLmdsb2JhbENvbmZpZyB9KSBhcyBDb25maWd1cmF0aW9uO1xuICAgIGlmIChjb25maWcpIHtcbiAgICAgIE9iamVjdC5hc3NpZ24oc2VjdGlvbkNvbmZpZywgY29uZmlnKTtcbiAgICB9XG4gICAgc2VjdGlvbkNvbmZpZy5zZWxlY3RvciA9IGBbZGF0YS1zZWN0aW9uLWlkPVwiJHtzZWN0aW9uSWR9XCJdIFtkYXRhLWZvY3VzYWJsZT10cnVlXWA7XG4gICAgcmV0dXJuIHNlY3Rpb25Db25maWc7XG4gIH07XG4gIFxuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgZWw6IEVsZW1lbnRSZWYpIHtcbiAgICB0aGlzLmVsZW1lbnQgPSBlbC5uYXRpdmVFbGVtZW50O1xuICB9XG5cbiAgbmdPbkluaXQoKSB7XG4gICAgbGV0IHNlY3Rpb25JZCA9IG51bGw7XG5cbiAgICBpZiAodGhpcy5mb2N1c1NlY3Rpb24gJiYgdGhpcy5mb2N1c1NlY3Rpb24uaWQgJiYgdGhpcy5mb2N1c1NlY3Rpb24uY29uZikge1xuICAgICAgc2VjdGlvbklkID0gdGhpcy5mb2N1c1NlY3Rpb24uaWQ7XG4gICAgICBjb25zdCBjb25maWcgPSB0aGlzLmZvY3VzU2VjdGlvbi5jb25mIGFzIENvbmZpZ3VyYXRpb247XG4gICAgICBjb25maWcuZWxlbWVudCA9IHRoaXMuZWwubmF0aXZlRWxlbWVudDtcbiAgICAgIHRyeSB7XG4gICAgICAgIHNuLmFkZChzZWN0aW9uSWQsIGNvbmZpZyk7XG4gICAgICB9IGNhdGNoIChlcnJvcikge31cbiAgICB9IGVsc2Uge1xuICAgICAgc2VjdGlvbklkID0gc24uYWRkKHVuZGVmaW5lZCwgZGVmYXVsdENvbmZpZ3VyYXRpb24pO1xuICAgIH1cblxuICAgIC8vIHNldCBzZWN0aW9uaWQgdG8gZGF0YSBzZXQgZm9yIHJlbW92aW5nIHdoZW4gdW5iaW5kaW5nXG4gICAgdGhpcy5lbC5uYXRpdmVFbGVtZW50LmRhdGFzZXQuc2VjdGlvbklkID0gc2VjdGlvbklkO1xuICAgIGlmICh0aGlzLmZvY3VzU2VjdGlvbi5jb25mKSB7XG4gICAgICBzbi5zZXQoc2VjdGlvbklkLCB0aGlzLmFzc2lnbkNvbmZpZyhzZWN0aW9uSWQsIHRoaXMuZm9jdXNTZWN0aW9uLmNvbmYpKTtcbiAgICB9XG4gICAgLy8gc2V0IGRlZmF1bHQgc2VjdGlvblxuICAgIC8vIGlmICh0aGlzLmZvY3VzU2VjdGlvbi5tb2RpZmllcnMuZGVmYXVsdCkge1xuICAgIC8vIHNuLnNldERlZmF1bHRTZWN0aW9uKHNlY3Rpb25JZCk7XG4gICAgLy8gICB9XG4gIH1cbn0iXX0=