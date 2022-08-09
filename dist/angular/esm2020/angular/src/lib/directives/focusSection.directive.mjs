import { Directive, Input } from '@angular/core';
import { sn } from '../../../../SpatialNavigation';
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
        console.log('focusSectionDirective calledddel = ', this.el);
        console.log('focusSeciton = ', this.focusSection);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9jdXNTZWN0aW9uLmRpcmVjdGl2ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9hbmd1bGFyL3NyYy9saWIvZGlyZWN0aXZlcy9mb2N1c1NlY3Rpb24uZGlyZWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxTQUFTLEVBQWMsS0FBSyxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQzdELE9BQU8sRUFBRSxFQUFFLEVBQUUsTUFBTSwrQkFBK0IsQ0FBQTtBQUNsRCxPQUFPLEVBQWlCLG9CQUFvQixFQUFFLE1BQU0saUNBQWlDLENBQUE7O0FBV3JGLE1BQU0sT0FBTyxxQkFBcUI7SUFlaEMsWUFBb0IsRUFBYztRQUFkLE9BQUUsR0FBRixFQUFFLENBQVk7UUFkbEMsWUFBTyxHQUE0QixTQUFTLENBQUM7UUFDcEMsaUJBQVksR0FBcUIsRUFBRSxDQUFDO1FBRXJDLGlCQUFZLEdBQUcsQ0FBQyxTQUE2QixFQUFFLE1BQXFCLEVBQWlCLEVBQUU7WUFDN0YsTUFBTSxZQUFZLEdBQUcsb0JBQW9CLENBQUMsQ0FBQyx3REFBd0Q7WUFDbkcsTUFBTSxhQUFhLEdBQUcsQ0FBQyxFQUFFLEdBQUcsWUFBWSxFQUFFLENBQWtCLENBQUM7WUFDN0QsSUFBSSxNQUFNLEVBQUU7Z0JBQ1YsTUFBTSxDQUFDLE1BQU0sQ0FBQyxhQUFhLEVBQUUsTUFBTSxDQUFDLENBQUM7YUFDdEM7WUFDRCxhQUFhLENBQUMsUUFBUSxHQUFHLHFCQUFxQixTQUFTLDBCQUEwQixDQUFDO1lBQ2xGLE9BQU8sYUFBYSxDQUFDO1FBQ3ZCLENBQUMsQ0FBQztRQUlBLElBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDLGFBQWEsQ0FBQztJQUNsQyxDQUFDO0lBRUQsUUFBUTtRQUNOLE9BQU8sQ0FBQyxHQUFHLENBQUMscUNBQXFDLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzVELE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFBO1FBQ2pELElBQUksU0FBUyxHQUFHLElBQUksQ0FBQztRQUNyQixJQUFJLElBQUksQ0FBQyxZQUFZLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUU7WUFDdkUsU0FBUyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDO1lBQ2pDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBcUIsQ0FBQztZQUN2RCxNQUFNLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsYUFBYSxDQUFDO1lBQ3ZDLElBQUk7Z0JBQ0YsRUFBRSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLENBQUM7YUFDM0I7WUFBQyxPQUFPLEtBQUssRUFBRSxHQUFFO1NBQ25CO2FBQU07WUFDTCxTQUFTLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztTQUNyRDtRQUVELHdEQUF3RDtRQUN4RCxJQUFJLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztRQUNwRCxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFO1lBQzFCLEVBQUUsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztTQUN6RTtRQUNELHNCQUFzQjtRQUN0Qiw2Q0FBNkM7UUFDN0MsbUNBQW1DO1FBQ25DLE1BQU07SUFDUixDQUFDOzswRkEzQ1UscUJBQXFCO3dFQUFyQixxQkFBcUI7dUZBQXJCLHFCQUFxQjtjQUhqQyxTQUFTO2VBQUM7Z0JBQ1QsUUFBUSxFQUFFLGdCQUFnQjthQUMzQjs2REFHVSxZQUFZO2tCQUFwQixLQUFLIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRGlyZWN0aXZlLCBFbGVtZW50UmVmLCBJbnB1dCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgc24gfSBmcm9tICcuLi8uLi8uLi8uLi9TcGF0aWFsTmF2aWdhdGlvbidcbmltcG9ydCB7IENvbmZpZ3VyYXRpb24sIGRlZmF1bHRDb25maWd1cmF0aW9uIH0gZnJvbSAnLi4vLi4vLi4vLi4vdHlwZXMvQ29uZmlndXJhdGlvbidcbi8vIGltcG9ydCB7IHNuLCBDb25maWd1cmF0aW9uLCBkZWZhdWx0Q29uZmlndXJhdGlvbn0gZnJvbSAnYm91c3NvbGUvYm91c3NvbGUnO1xuLy8gaW1wb3J0IHsgQ29uZmlndXJhdGlvbiwgZGVmYXVsdENvbmZpZ3VyYXRpb24gfSBmcm9tICdzcmMvdHlwZXMvQ29uZmlndXJhdGlvbic7XG5cbmludGVyZmFjZSBTZWN0aW9uRGlyZWN0aXZlIHtcbiAgaWQ/OiBzdHJpbmc7XG4gIGNvbmY/OiBDb25maWd1cmF0aW9uXG59XG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbZm9jdXNTZWN0aW9uXSdcbn0pXG5leHBvcnQgY2xhc3MgRm9jdXNTZWN0aW9uRGlyZWN0aXZlIHtcbiAgZWxlbWVudDogSFRNTEVsZW1lbnQgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gIEBJbnB1dCgpIGZvY3VzU2VjdGlvbjogU2VjdGlvbkRpcmVjdGl2ZSA9IHt9O1xuXG4gIHByaXZhdGUgYXNzaWduQ29uZmlnID0gKHNlY3Rpb25JZDogc3RyaW5nIHwgdW5kZWZpbmVkLCBjb25maWc6IENvbmZpZ3VyYXRpb24pOiBDb25maWd1cmF0aW9uID0+IHtcbiAgICBjb25zdCBnbG9iYWxDb25maWcgPSBkZWZhdWx0Q29uZmlndXJhdGlvbjsgLy8gVE8gRE8gOiBpbnRlZ3JhdGUgYXBwLmdsb2JhbENvbmZpZyBnaXZlbiBieSBkZXZlbG9wZXJcbiAgICBjb25zdCBzZWN0aW9uQ29uZmlnID0gKHsgLi4uZ2xvYmFsQ29uZmlnIH0pIGFzIENvbmZpZ3VyYXRpb247XG4gICAgaWYgKGNvbmZpZykge1xuICAgICAgT2JqZWN0LmFzc2lnbihzZWN0aW9uQ29uZmlnLCBjb25maWcpO1xuICAgIH1cbiAgICBzZWN0aW9uQ29uZmlnLnNlbGVjdG9yID0gYFtkYXRhLXNlY3Rpb24taWQ9XCIke3NlY3Rpb25JZH1cIl0gW2RhdGEtZm9jdXNhYmxlPXRydWVdYDtcbiAgICByZXR1cm4gc2VjdGlvbkNvbmZpZztcbiAgfTtcbiAgXG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBlbDogRWxlbWVudFJlZikge1xuICAgIHRoaXMuZWxlbWVudCA9IGVsLm5hdGl2ZUVsZW1lbnQ7XG4gIH1cblxuICBuZ09uSW5pdCgpIHtcbiAgICBjb25zb2xlLmxvZygnZm9jdXNTZWN0aW9uRGlyZWN0aXZlIGNhbGxlZGRkZWwgPSAnLCB0aGlzLmVsKTtcbiAgICBjb25zb2xlLmxvZygnZm9jdXNTZWNpdG9uID0gJywgdGhpcy5mb2N1c1NlY3Rpb24pXG4gICAgbGV0IHNlY3Rpb25JZCA9IG51bGw7XG4gICAgaWYgKHRoaXMuZm9jdXNTZWN0aW9uICYmIHRoaXMuZm9jdXNTZWN0aW9uLmlkICYmIHRoaXMuZm9jdXNTZWN0aW9uLmNvbmYpIHtcbiAgICAgIHNlY3Rpb25JZCA9IHRoaXMuZm9jdXNTZWN0aW9uLmlkO1xuICAgICAgY29uc3QgY29uZmlnID0gdGhpcy5mb2N1c1NlY3Rpb24uY29uZiBhcyBDb25maWd1cmF0aW9uO1xuICAgICAgY29uZmlnLmVsZW1lbnQgPSB0aGlzLmVsLm5hdGl2ZUVsZW1lbnQ7XG4gICAgICB0cnkge1xuICAgICAgICBzbi5hZGQoc2VjdGlvbklkLCBjb25maWcpO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHt9XG4gICAgfSBlbHNlIHtcbiAgICAgIHNlY3Rpb25JZCA9IHNuLmFkZCh1bmRlZmluZWQsIGRlZmF1bHRDb25maWd1cmF0aW9uKTtcbiAgICB9XG5cbiAgICAvLyBzZXQgc2VjdGlvbmlkIHRvIGRhdGEgc2V0IGZvciByZW1vdmluZyB3aGVuIHVuYmluZGluZ1xuICAgIHRoaXMuZWwubmF0aXZlRWxlbWVudC5kYXRhc2V0LnNlY3Rpb25JZCA9IHNlY3Rpb25JZDtcbiAgICBpZiAodGhpcy5mb2N1c1NlY3Rpb24uY29uZikge1xuICAgICAgc24uc2V0KHNlY3Rpb25JZCwgdGhpcy5hc3NpZ25Db25maWcoc2VjdGlvbklkLCB0aGlzLmZvY3VzU2VjdGlvbi5jb25mKSk7XG4gICAgfVxuICAgIC8vIHNldCBkZWZhdWx0IHNlY3Rpb25cbiAgICAvLyBpZiAodGhpcy5mb2N1c1NlY3Rpb24ubW9kaWZpZXJzLmRlZmF1bHQpIHtcbiAgICAvLyBzbi5zZXREZWZhdWx0U2VjdGlvbihzZWN0aW9uSWQpO1xuICAgIC8vICAgfVxuICB9XG59Il19