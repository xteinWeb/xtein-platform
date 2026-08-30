import {
  ChangeDetectionStrategy,
  Component,
  signal,
  ViewEncapsulation
} from '@angular/core';

import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  Router
} from '@angular/router';

import {
  finalize
} from 'rxjs';

import {
  AuthService,
  CompanyOption,
  PasswordRecoveryService
} from '@xtein/auth';

import {
  XteinButtonComponent,
  XteinInputComponent,
  XteinPasswordComponent,
  XteinSelectComponent,
  XteinVerificationCodeComponent
} from '@xtein/ui';

/**
 * Available views inside the XTEIN authentication card.
 */
type LoginView =
  | 'sign-in'
  | 'recovery-user'
  | 'recovery-code'
  | 'recovery-password';

/**
 * Provides XTEIN authentication and password recovery.
 */
@Component({
  selector: 'xtein-login-page',
  standalone: true,

  imports: [
    ReactiveFormsModule,
    XteinInputComponent,
    XteinPasswordComponent,
    XteinSelectComponent,
    XteinButtonComponent,
    XteinVerificationCodeComponent
  ],

  templateUrl:
    './login.component.html',

  styleUrl:
    './login.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,

  encapsulation:
    ViewEncapsulation.None
})
export class LoginComponent {

  readonly view =
    signal<LoginView>(
      'sign-in'
    );

  readonly companies =
    signal<CompanyOption[]>([]);

  readonly isValidatingUser =
    signal(false);

  readonly isSubmitting =
    signal(false);

  readonly isRecoveryBusy =
    signal(false);

  readonly errorMessage =
    signal('');

  readonly successMessage =
    signal('');

  readonly recoveryErrorMessage =
    signal('');

  readonly recoverySuccessMessage =
    signal('');

  readonly recoveryEmail =
    signal('');

  readonly passwordPolicyErrors =
    signal<readonly string[]>([]);

  readonly confirmationError =
    signal('');

  private readonly associatedUnitId =
    signal('');

  private readonly validatedUserId =
    signal('');

  private readonly recoveryUserId =
    signal('');

  readonly loginForm =
    new FormGroup({

      userId:
        new FormControl(
          '',
          {
            nonNullable: true,
            validators: [
              Validators.required,
              Validators.minLength(5)
            ]
          }
        ),

      password:
        new FormControl(
          '',
          {
            nonNullable: true,
            validators: [
              Validators.required
            ]
          }
        ),

      companyId:
        new FormControl(
          '',
          {
            nonNullable: true,
            validators: [
              Validators.required
            ]
          }
        )
    });

  readonly recoveryUserForm =
    new FormGroup({

      userId:
        new FormControl(
          '',
          {
            nonNullable: true,
            validators: [
              Validators.required,
              Validators.minLength(5)
            ]
          }
        )
    });

  readonly recoveryCodeForm =
    new FormGroup({

      code:
        new FormControl(
          '',
          {
            nonNullable: true,
            validators: [
              Validators.required,
              Validators.pattern(
                /^\d{6}$/
              )
            ]
          }
        )
    });

  readonly recoveryPasswordForm =
    new FormGroup({

      newPassword:
        new FormControl(
          '',
          {
            nonNullable: true,
            validators: [
              Validators.required
            ]
          }
        ),

      confirmationPassword:
        new FormControl(
          '',
          {
            nonNullable: true,
            validators: [
              Validators.required
            ]
          }
        )
    });

  constructor(
    private readonly authService:
      AuthService,

    private readonly passwordRecovery:
      PasswordRecoveryService,

    private readonly router:
      Router
  ) {
  }

  get userIdControl():
    FormControl<string> {

    return this.loginForm
      .controls.userId;
  }

  get passwordControl():
    FormControl<string> {

    return this.loginForm
      .controls.password;
  }

  get companyIdControl():
    FormControl<string> {

    return this.loginForm
      .controls.companyId;
  }

  get recoveryUserControl():
    FormControl<string> {

    return this.recoveryUserForm
      .controls.userId;
  }

  get recoveryCodeControl():
    FormControl<string> {

    return this.recoveryCodeForm
      .controls.code;
  }

  get newPasswordControl():
    FormControl<string> {

    return this.recoveryPasswordForm
      .controls.newPassword;
  }

  get confirmationPasswordControl():
    FormControl<string> {

    return this.recoveryPasswordForm
      .controls.confirmationPassword;
  }

  /**
   * Validates the sign-in user and loads companies.
   */
  validateUser(): void {

    const userId =
      this.userIdControl.value
        .trim();

    this.errorMessage.set('');
    this.successMessage.set('');

    if (!userId) {

      this.clearValidatedUser();

      return;
    }

    if (
      userId.length < 5
    ) {

      this.clearValidatedUser();

      this.errorMessage.set(
        'Usuario con mínimo 5 caracteres.'
      );

      return;
    }

    if (
      this.validatedUserId() === userId &&
      this.companies().length > 0
    ) {
      return;
    }

    this.isValidatingUser.set(
      true
    );

    this.authService
      .validateUser(
        userId
      )
      .pipe(
        finalize(() =>
          this.isValidatingUser
            .set(false)
        )
      )
      .subscribe({

        next: result => {

          if (
            !result.isValid
          ) {

            this.clearValidatedUser();

            this.errorMessage.set(
              result.errorMessage ??
              'No fue posible validar el usuario.'
            );

            return;
          }

          const availableCompanies =
            [...result.companies];

          if (
            availableCompanies.length === 0
          ) {

            this.clearValidatedUser();

            this.errorMessage.set(
              'El usuario no tiene empresas disponibles.'
            );

            return;
          }

          this.companies.set(
            availableCompanies
          );

          this.associatedUnitId.set(
            result.associatedUnitId ??
            ''
          );

          this.validatedUserId.set(
            userId
          );

          this.companyIdControl
            .setValue(
              availableCompanies[0].id
            );
        },

        error: error => {

          this.clearValidatedUser();

          this.errorMessage.set(
            this.getHttpErrorMessage(
              error,
              'No fue posible validar el usuario.'
            )
          );
        }
      });
  }

  /**
   * Executes authentication.
   */
  submit(): void {

    this.errorMessage.set('');
    this.successMessage.set('');

    if (
      this.loginForm.invalid
    ) {

      this.loginForm
        .markAllAsTouched();

      this.errorMessage.set(
        'Faltan datos por completar.'
      );

      return;
    }

    const userId =
      this.userIdControl.value
        .trim();

    if (
      this.validatedUserId() !==
      userId
    ) {

      this.errorMessage.set(
        'Debe validar nuevamente el usuario.'
      );

      return;
    }

    const companyId =
      this.companyIdControl.value;

    const selectedCompany =
      this.companies()
        .find(company =>
          company.id ===
          companyId
        );

    if (!selectedCompany) {

      this.errorMessage.set(
        'Seleccione una empresa válida.'
      );

      return;
    }

    this.isSubmitting.set(
      true
    );

    this.authService
      .login({

        userId,

        password:
          this.passwordControl.value,

        companyId:
          selectedCompany.id,

        companyName:
          selectedCompany.name,

        associatedUnitId:
          this.associatedUnitId()
      })
      .pipe(
        finalize(() =>
          this.isSubmitting.set(
            false
          )
        )
      )
      .subscribe({

        next: result => {

          if (
            !result.isAuthenticated
          ) {

            this.errorMessage.set(
              result.errorMessage ??
              'No fue posible iniciar sesión.'
            );

            return;
          }

          void this.router
            .navigateByUrl(
              '/home'
            );
        },

        error: error => {

          this.errorMessage.set(
            this.getHttpErrorMessage(
              error,
              'No fue posible iniciar sesión.'
            )
          );
        }
      });
  }

  /**
   * Opens the password-recovery workflow.
   */
  openPasswordRecovery(): void {

    this.clearRecoveryMessages();

    const currentUser =
      this.userIdControl.value
        .trim();

    this.recoveryUserControl
      .setValue(
        currentUser
      );

    this.view.set(
      'recovery-user'
    );
  }

  /**
   * Requests the recovery code.
   */
  requestRecoveryCode(): void {

    this.clearRecoveryMessages();

    const userId =
      this.recoveryUserControl.value
        .trim();

    if (
      userId.length < 5
    ) {

      this.recoveryErrorMessage.set(
        'El usuario es inválido.'
      );

      return;
    }

    this.isRecoveryBusy.set(
      true
    );

    this.passwordRecovery
      .requestCode(
        userId
      )
      .pipe(
        finalize(() =>
          this.isRecoveryBusy.set(
            false
          )
        )
      )
      .subscribe({

        next: result => {

          if (
            !result.isSuccessful
          ) {

            this.recoveryErrorMessage
              .set(
                result.errorMessage ??
                'No fue posible generar el código.'
              );

            return;
          }

          this.recoveryUserId.set(
            userId
          );

          this.recoveryEmail.set(
            result.destinationEmail ??
            ''
          );

          this.recoveryCodeForm.reset({
            code: ''
          });

          this.recoverySuccessMessage
            .set(
              result.destinationEmail
                ? `Se ha enviado el código de verificación al correo electrónico ${result.destinationEmail}.`
                : 'Se ha enviado el código de verificación.'
            );

          this.view.set(
            'recovery-code'
          );
        },

        error: error => {

          this.recoveryErrorMessage
            .set(
              this.getHttpErrorMessage(
                error,
                'No fue posible generar el código de recuperación.'
              )
            );
        }
      });
  }

  /**
   * Validates the six-digit recovery code.
   */
  validateRecoveryCode(): void {

    this.clearRecoveryMessages();

    const code =
      this.recoveryCodeControl.value
        .trim();

    if (
      !/^\d{6}$/.test(code)
    ) {

      this.recoveryErrorMessage.set(
        'Digite todos los números del código (6 dígitos).'
      );

      return;
    }

    this.isRecoveryBusy.set(
      true
    );

    this.passwordRecovery
      .validateCode(
        this.recoveryUserId(),
        code
      )
      .pipe(
        finalize(() =>
          this.isRecoveryBusy.set(
            false
          )
        )
      )
      .subscribe({

        next: result => {

          if (
            !result.isValid
          ) {

            this.recoveryErrorMessage
              .set(
                result.errorMessage ??
                'El código ingresado no es válido.'
              );

            return;
          }

          this.recoveryPasswordForm
            .reset({
              newPassword: '',
              confirmationPassword: ''
            });

          this.passwordPolicyErrors
            .set([]);

          this.confirmationError
            .set('');

          this.view.set(
            'recovery-password'
          );
        },

        error: error => {

          this.recoveryErrorMessage
            .set(
              this.getHttpErrorMessage(
                error,
                'No fue posible validar el código.'
              )
            );
        }
      });
  }

  /**
   * Evaluates password policy for immediate feedback.
   */
  validateNewPassword(): void {

    const password =
      this.newPasswordControl.value;

    if (!password) {

      this.passwordPolicyErrors.set(
        []
      );

      return;
    }

    const validation =
      this.passwordRecovery
        .validatePassword(
          this.recoveryUserId(),
          password
        );

    this.passwordPolicyErrors
      .set(
        validation.errors
      );
  }

  /**
   * Validates password confirmation.
   */
  validatePasswordConfirmation(): void {

    const newPassword =
      this.newPasswordControl.value;

    const confirmationPassword =
      this.confirmationPasswordControl
        .value;

    if (
      !confirmationPassword
    ) {

      this.confirmationError.set(
        ''
      );

      return;
    }

    this.confirmationError.set(
      newPassword ===
      confirmationPassword
        ? ''
        : 'Las contraseñas no coinciden.'
    );
  }

  /**
   * Changes the password.
   */
  changeRecoveredPassword(): void {

    this.clearRecoveryMessages();

    const newPassword =
      this.newPasswordControl.value;

    const confirmationPassword =
      this.confirmationPasswordControl
        .value;

    const policy =
      this.passwordRecovery
        .validatePassword(
          this.recoveryUserId(),
          newPassword
        );

    this.passwordPolicyErrors
      .set(
        policy.errors
      );

    if (
      !policy.isValid
    ) {

      this.recoveryErrorMessage
        .set(
          policy.message
        );

      return;
    }

    if (
      newPassword !==
      confirmationPassword
    ) {

      this.confirmationError.set(
        'Las contraseñas no coinciden.'
      );

      this.recoveryErrorMessage.set(
        'Las contraseñas no coinciden.'
      );

      return;
    }

    this.isRecoveryBusy.set(
      true
    );

    this.passwordRecovery
      .changePassword(
        this.recoveryUserId(),
        newPassword,
        confirmationPassword
      )
      .pipe(
        finalize(() =>
          this.isRecoveryBusy.set(
            false
          )
        )
      )
      .subscribe({

        next: result => {

          if (
            !result.isSuccessful
          ) {

            this.recoveryErrorMessage
              .set(
                result.errorMessage ??
                'No fue posible actualizar la contraseña.'
              );

            return;
          }

          this.resetRecovery();

          this.resetLogin();

          this.successMessage.set(
            'Contraseña actualizada exitosamente.'
          );

          this.view.set(
            'sign-in'
          );
        },

        error: error => {

          this.recoveryErrorMessage
            .set(
              this.getHttpErrorMessage(
                error,
                'No fue posible actualizar la contraseña.'
              )
            );
        }
      });
  }

  /**
   * Cancels password recovery and returns to sign-in.
   */
  cancelPasswordRecovery(): void {

    this.resetRecovery();
    this.resetLogin();

    this.view.set(
      'sign-in'
    );
  }

  private resetLogin(): void {

    this.loginForm.reset({
      userId: '',
      password: '',
      companyId: ''
    });

    this.clearValidatedUser();

    this.errorMessage.set('');
  }

  private resetRecovery(): void {

    this.recoveryUserForm.reset({
      userId: ''
    });

    this.recoveryCodeForm.reset({
      code: ''
    });

    this.recoveryPasswordForm.reset({
      newPassword: '',
      confirmationPassword: ''
    });

    this.recoveryUserId.set('');
    this.recoveryEmail.set('');

    this.passwordPolicyErrors.set(
      []
    );

    this.confirmationError.set('');

    this.clearRecoveryMessages();
  }

  private clearValidatedUser(): void {

    this.companies.set([]);

    this.associatedUnitId.set('');

    this.validatedUserId.set('');

    this.companyIdControl
      .setValue('');
  }

  private clearRecoveryMessages(): void {

    this.recoveryErrorMessage.set('');
    this.recoverySuccessMessage.set('');
  }

  private getHttpErrorMessage(
    error: unknown,
    fallbackMessage: string
  ): string {

    if (
      error === null ||
      typeof error !== 'object'
    ) {
      return fallbackMessage;
    }

    const errorRecord =
      error as Record<string, unknown>;

    const backendError =
      errorRecord['error'];

    if (
      backendError !== null &&
      typeof backendError === 'object'
    ) {

      const backendRecord =
        backendError as
          Record<string, unknown>;

      const message =
        backendRecord['ErrMensaje'] ??
        backendRecord['message'];

      if (
        typeof message === 'string' &&
        message.trim()
      ) {

        return message.trim();
      }
    }

    return fallbackMessage;
  }
}