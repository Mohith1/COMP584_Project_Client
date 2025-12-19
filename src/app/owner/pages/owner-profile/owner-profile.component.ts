import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { OwnerAuthService } from '../../../core/services/owner-auth.service';
import { OwnerStateService } from '../../../core/state/owner-state.service';

@Component({
  selector: 'app-owner-profile',
  templateUrl: './owner-profile.component.html',
  styleUrls: ['./owner-profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OwnerProfileComponent implements OnInit {
  readonly owner = this.ownerState.owner;

  profileForm = this.fb.group({
    companyName: [{ value: '', disabled: true }],
    contactEmail: [{ value: '', disabled: true }],
    contactPhone: [''],
    city: [{ value: '', disabled: true }],
    country: [{ value: '', disabled: true }],
    timeZone: ['']
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly ownerAuth: OwnerAuthService,
    private readonly ownerState: OwnerStateService
  ) {}

  ngOnInit(): void {
    this.ownerAuth.loadProfile().subscribe((profile) => {
      if (!profile) {
        // No profile exists yet - leave form empty (user needs to register first)
        console.log('📝 Profile: No owner profile exists yet');
        return;
      }
      this.profileForm.patchValue({
        companyName: profile.companyName,
        contactEmail: profile.contactEmail,
        contactPhone: profile.contactPhone ?? '',
        city: profile.city ?? '',
        country: profile.country ?? '',
        timeZone: profile.timeZone ?? ''
      });
    });
  }

  saveProfile() {
    if (this.profileForm.invalid) {
      return;
    }
    const formValue = this.profileForm.getRawValue();
    const ownerId = this.ownerAuth.ownerId();
    if (!ownerId) {
      return;
    }
    const profile = {
      ownerId,
      contactPhone: formValue.contactPhone ?? undefined,
      timeZone: formValue.timeZone ?? undefined
    };
    this.ownerAuth
      .updateProfile(profile)
      .subscribe(() => {
        this.ownerAuth.loadProfile().subscribe();
      });
  }
}
