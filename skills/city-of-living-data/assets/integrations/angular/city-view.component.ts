// City of Living Data — Angular standalone component.
// Add "./src/app/city/city-of-living-data.css" to the "styles" array in angular.json (or import it in styles.css),
// and enable "resolveJsonModule" in tsconfig.json to import world.json.
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, NgZone, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from '@angular/core';
// @ts-ignore — plain ES module
import { createCity } from './city-of-living-data.js';
import defaultWorld from './world.json';

@Component({
  selector: 'app-city-view',
  standalone: true,
  template: `<div #host class="city-view"></div>`,
  styles: [`:host { display: block; height: 100%; } .city-view { position: relative; width: 100%; height: 100%; min-height: 480px; }`],
})
export class CityViewComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('host', { static: true }) host!: ElementRef<HTMLDivElement>;
  @Input() world: unknown = defaultWorld;
  @Input() options: Record<string, unknown> = {};
  @Output() ready = new EventEmitter<any>();
  private api: any;
  constructor(private zone: NgZone) {}
  ngAfterViewInit() { this.mount(); }
  // a new world or new options rebuild the city; for live changes call api.update(patch)
  ngOnChanges(c: SimpleChanges) { if (this.api && (c['world'] || c['options'])) this.mount(); }
  private mount() {
    this.api?.destroy();
    // the render loop runs outside Angular so it never triggers change detection
    this.zone.runOutsideAngular(() => { this.api = createCity(this.host.nativeElement, this.world, this.options); });
    this.ready.emit(this.api);
  }
  ngOnDestroy() { this.api?.destroy(); }
}
