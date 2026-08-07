import { Service, signal } from '@angular/core';

@Service()
export class MessageService {
  private readonly messagesSignal = signal<string[]>([]);

  readonly messages = this.messagesSignal.asReadonly();

  add(message: string): void {
    this.messagesSignal.update((messages) => [...messages, message]);
  }

  clear(): void {
    this.messagesSignal.set([]);
  }
}
