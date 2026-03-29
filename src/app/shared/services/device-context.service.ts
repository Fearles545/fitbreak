import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DeviceContextService {
  readonly isPwa = signal(matchMedia('(display-mode: standalone)').matches);
  readonly isMobile = signal(navigator.maxTouchPoints > 0);
  readonly hasVibration = signal('vibrate' in navigator);
  readonly hasNotificationApi = signal('Notification' in window);

  readonly notificationPermission = signal<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  );

  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!this.hasNotificationApi()) return 'denied';
    const result = await Notification.requestPermission();
    this.notificationPermission.set(result);
    return result;
  }
}
