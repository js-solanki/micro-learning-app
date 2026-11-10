import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Badge } from '../../../core/models/badge.model';

@Component({
  selector: 'app-badge-chip',
  standalone: true,
  imports: [MatChipsModule, MatIconModule, MatTooltipModule],
  templateUrl: './badge-chip.component.html',
  styleUrl: './badge-chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BadgeChipComponent {
  @Input({ required: true }) badge!: Badge;
  @Input() unlocked = false;
}
