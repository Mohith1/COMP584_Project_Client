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
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: [{ value: '', disabled: true }],
    companyName: ['', Validators.required],
    phoneNumber: ['']
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly ownerAuth: OwnerAuthService,
    private readonly ownerState: OwnerStateService
  ) {}

  ngOnInit(): void {
    this.ownerAuth.loadProfile().subscribe((profile) => {
      this.profileForm.patchValue(profile);
    });
  }

  saveProfile() {
    if (this.profileForm.invalid) {
      return;
    }
    this.ownerAuth
      .updateProfile(this.profileForm.getRawValue())
      .subscribe(() => {
        this.ownerAuth.loadProfile().subscribe();
      });
  }
}

