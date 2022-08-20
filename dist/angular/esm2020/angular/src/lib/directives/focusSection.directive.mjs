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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9jdXNTZWN0aW9uLmRpcmVjdGl2ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9hbmd1bGFyL3NyYy9saWIvZGlyZWN0aXZlcy9mb2N1c1NlY3Rpb24uZGlyZWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxTQUFTLEVBQWMsS0FBSyxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQzdELE9BQU8sRUFBRSxFQUFFLEVBQUUsTUFBTSwrQkFBK0IsQ0FBQTtBQUNsRCxPQUFPLEVBQWlCLG9CQUFvQixFQUFFLE1BQU0saUNBQWlDLENBQUE7O0FBU3JGLE1BQU0sT0FBTyxxQkFBcUI7SUFlaEMsWUFBb0IsRUFBYztRQUFkLE9BQUUsR0FBRixFQUFFLENBQVk7UUFkbEMsWUFBTyxHQUE0QixTQUFTLENBQUM7UUFDcEMsaUJBQVksR0FBcUIsRUFBRSxDQUFDO1FBRXJDLGlCQUFZLEdBQUcsQ0FBQyxTQUE2QixFQUFFLE1BQXFCLEVBQWlCLEVBQUU7WUFDN0YsTUFBTSxZQUFZLEdBQUcsb0JBQW9CLENBQUMsQ0FBQyx3REFBd0Q7WUFDbkcsTUFBTSxhQUFhLEdBQUcsQ0FBQyxFQUFFLEdBQUcsWUFBWSxFQUFFLENBQWtCLENBQUM7WUFDN0QsSUFBSSxNQUFNLEVBQUU7Z0JBQ1YsTUFBTSxDQUFDLE1BQU0sQ0FBQyxhQUFhLEVBQUUsTUFBTSxDQUFDLENBQUM7YUFDdEM7WUFDRCxhQUFhLENBQUMsUUFBUSxHQUFHLHFCQUFxQixTQUFTLDBCQUEwQixDQUFDO1lBQ2xGLE9BQU8sYUFBYSxDQUFDO1FBQ3ZCLENBQUMsQ0FBQztRQUlBLElBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDLGFBQWEsQ0FBQztJQUNsQyxDQUFDO0lBRUQsUUFBUTtRQUNOLElBQUksU0FBUyxHQUFHLElBQUksQ0FBQztRQUNyQixJQUFJLElBQUksQ0FBQyxZQUFZLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUU7WUFDdkUsU0FBUyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDO1lBQ2pDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBcUIsQ0FBQztZQUN2RCxNQUFNLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsYUFBYSxDQUFDO1lBQ3ZDLElBQUk7Z0JBQ0YsRUFBRSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLENBQUM7YUFDM0I7WUFBQyxPQUFPLEtBQUssRUFBRSxHQUFFO1NBQ25CO2FBQU07WUFDTCxTQUFTLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztTQUNyRDtRQUVELHdEQUF3RDtRQUN4RCxJQUFJLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztRQUNwRCxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFO1lBQzFCLEVBQUUsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztTQUN6RTtRQUNELHNCQUFzQjtRQUN0Qiw2Q0FBNkM7UUFDN0MsbUNBQW1DO1FBQ25DLE1BQU07SUFDUixDQUFDOzswRkF6Q1UscUJBQXFCO3dFQUFyQixxQkFBcUI7dUZBQXJCLHFCQUFxQjtjQUhqQyxTQUFTO2VBQUM7Z0JBQ1QsUUFBUSxFQUFFLGdCQUFnQjthQUMzQjs2REFHVSxZQUFZO2tCQUFwQixLQUFLIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRGlyZWN0aXZlLCBFbGVtZW50UmVmLCBJbnB1dCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgc24gfSBmcm9tICcuLi8uLi8uLi8uLi9TcGF0aWFsTmF2aWdhdGlvbidcbmltcG9ydCB7IENvbmZpZ3VyYXRpb24sIGRlZmF1bHRDb25maWd1cmF0aW9uIH0gZnJvbSAnLi4vLi4vLi4vLi4vdHlwZXMvQ29uZmlndXJhdGlvbidcblxuaW50ZXJmYWNlIFNlY3Rpb25EaXJlY3RpdmUge1xuICBpZD86IHN0cmluZztcbiAgY29uZj86IENvbmZpZ3VyYXRpb25cbn1cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tmb2N1c1NlY3Rpb25dJ1xufSlcbmV4cG9ydCBjbGFzcyBGb2N1c1NlY3Rpb25EaXJlY3RpdmUge1xuICBlbGVtZW50OiBIVE1MRWxlbWVudCB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgQElucHV0KCkgZm9jdXNTZWN0aW9uOiBTZWN0aW9uRGlyZWN0aXZlID0ge307XG5cbiAgcHJpdmF0ZSBhc3NpZ25Db25maWcgPSAoc2VjdGlvbklkOiBzdHJpbmcgfCB1bmRlZmluZWQsIGNvbmZpZzogQ29uZmlndXJhdGlvbik6IENvbmZpZ3VyYXRpb24gPT4ge1xuICAgIGNvbnN0IGdsb2JhbENvbmZpZyA9IGRlZmF1bHRDb25maWd1cmF0aW9uOyAvLyBUTyBETyA6IGludGVncmF0ZSBhcHAuZ2xvYmFsQ29uZmlnIGdpdmVuIGJ5IGRldmVsb3BlclxuICAgIGNvbnN0IHNlY3Rpb25Db25maWcgPSAoeyAuLi5nbG9iYWxDb25maWcgfSkgYXMgQ29uZmlndXJhdGlvbjtcbiAgICBpZiAoY29uZmlnKSB7XG4gICAgICBPYmplY3QuYXNzaWduKHNlY3Rpb25Db25maWcsIGNvbmZpZyk7XG4gICAgfVxuICAgIHNlY3Rpb25Db25maWcuc2VsZWN0b3IgPSBgW2RhdGEtc2VjdGlvbi1pZD1cIiR7c2VjdGlvbklkfVwiXSBbZGF0YS1mb2N1c2FibGU9dHJ1ZV1gO1xuICAgIHJldHVybiBzZWN0aW9uQ29uZmlnO1xuICB9O1xuICBcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGVsOiBFbGVtZW50UmVmKSB7XG4gICAgdGhpcy5lbGVtZW50ID0gZWwubmF0aXZlRWxlbWVudDtcbiAgfVxuXG4gIG5nT25Jbml0KCkge1xuICAgIGxldCBzZWN0aW9uSWQgPSBudWxsO1xuICAgIGlmICh0aGlzLmZvY3VzU2VjdGlvbiAmJiB0aGlzLmZvY3VzU2VjdGlvbi5pZCAmJiB0aGlzLmZvY3VzU2VjdGlvbi5jb25mKSB7XG4gICAgICBzZWN0aW9uSWQgPSB0aGlzLmZvY3VzU2VjdGlvbi5pZDtcbiAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuZm9jdXNTZWN0aW9uLmNvbmYgYXMgQ29uZmlndXJhdGlvbjtcbiAgICAgIGNvbmZpZy5lbGVtZW50ID0gdGhpcy5lbC5uYXRpdmVFbGVtZW50O1xuICAgICAgdHJ5IHtcbiAgICAgICAgc24uYWRkKHNlY3Rpb25JZCwgY29uZmlnKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7fVxuICAgIH0gZWxzZSB7XG4gICAgICBzZWN0aW9uSWQgPSBzbi5hZGQodW5kZWZpbmVkLCBkZWZhdWx0Q29uZmlndXJhdGlvbik7XG4gICAgfVxuXG4gICAgLy8gc2V0IHNlY3Rpb25pZCB0byBkYXRhIHNldCBmb3IgcmVtb3Zpbmcgd2hlbiB1bmJpbmRpbmdcbiAgICB0aGlzLmVsLm5hdGl2ZUVsZW1lbnQuZGF0YXNldC5zZWN0aW9uSWQgPSBzZWN0aW9uSWQ7XG4gICAgaWYgKHRoaXMuZm9jdXNTZWN0aW9uLmNvbmYpIHtcbiAgICAgIHNuLnNldChzZWN0aW9uSWQsIHRoaXMuYXNzaWduQ29uZmlnKHNlY3Rpb25JZCwgdGhpcy5mb2N1c1NlY3Rpb24uY29uZikpO1xuICAgIH1cbiAgICAvLyBzZXQgZGVmYXVsdCBzZWN0aW9uXG4gICAgLy8gaWYgKHRoaXMuZm9jdXNTZWN0aW9uLm1vZGlmaWVycy5kZWZhdWx0KSB7XG4gICAgLy8gc24uc2V0RGVmYXVsdFNlY3Rpb24oc2VjdGlvbklkKTtcbiAgICAvLyAgIH1cbiAgfVxufSJdfQ==