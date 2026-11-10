import {
  Directive,
  ElementRef,
  Input,
  OnChanges,
  Renderer2,
  SimpleChanges,
  inject
} from '@angular/core';

/**
 * Attribute directive that plays a short "bounce" animation on its host element
 * whenever the bound trigger value changes to a truthy value. Used for instant
 * visual feedback on quiz completion / correct-answer states.
 *
 * Usage: <div [appBounce]="quizJustCompleted()">...</div>
 */
@Directive({
  selector: '[appBounce]',
  standalone: true
})
export class BounceDirective implements OnChanges {
  @Input('appBounce') trigger: boolean | number | string = false;

  /** Optional CSS class applied in addition to the bounce animation, e.g. 'ml-success'. */
  @Input() bounceClass: string | null = null;

  private el = inject(ElementRef<HTMLElement>);
  private renderer = inject(Renderer2);

  ngOnChanges(changes: SimpleChanges): void {
    const change = changes['trigger'];
    if (!change) {
      return;
    }
    const isTruthy = !!change.currentValue;
    const wasTruthy = !!change.previousValue;

    if (isTruthy && (!wasTruthy || change.firstChange)) {
      this.playBounce();
    }
  }

  private playBounce(): void {
    const host = this.el.nativeElement;

    this.renderer.setStyle(host, 'animation', 'none');
    if (this.bounceClass) {
      this.renderer.addClass(host, this.bounceClass);
    }

    // Force reflow so the animation can be re-triggered on repeated events.
    void host.offsetWidth;

    this.renderer.setStyle(host, 'animation', 'ml-bounce 0.5s ease');

    const cleanup = () => {
      this.renderer.setStyle(host, 'animation', '');
      if (this.bounceClass) {
        this.renderer.removeClass(host, this.bounceClass);
      }
      host.removeEventListener('animationend', cleanup);
    };
    host.addEventListener('animationend', cleanup);
  }
}
