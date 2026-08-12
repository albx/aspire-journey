import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { MessageService } from '../services/message';

@Component({
  selector: 'app-messages',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './messages.html',
  styleUrl: './messages.css',
})
export class Messages {
  protected readonly messageService = inject(MessageService);
}
