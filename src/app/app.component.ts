import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { DatabaseService, Usuario } from './services/database.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  today: string | number | Date | undefined;
  currentUser: Usuario | null = null;
  adminStats: any = null;
  
  // Referencias a funciones internas para acceso desde métodos públicos
  private generateBeerCatalogFn: (() => void) | null = null;
  private renderCartFn: (() => void) | null = null;
  private generateOrdersListFn: (() => void) | null = null;
  private renderFavoritesFn: (() => void) | null = null;
  private renderAddressesFn: (() => void) | null = null;
  private renderNotificationsFn: (() => void) | null = null;
  private renderSettingsFn: (() => void) | null = null;
  private renderRecommendationsFn: (() => void) | null = null;
  private showViewFn: ((view: any) => void) | null = null;
  private views: any = null;
  private showMessageFn: ((message: string, type?: string, autoClose?: boolean) => void) | null = null;

  public currentUser$ = this.databaseService.currentUser$;
  private pointsHistoryCache: any[] | null = null;
  private pointsHistoryCacheTimestamp: number = 0;
  private cacheTimeout = 30000; // 30 segundos
  title = 'cerveza-premium';
  
  constructor(private databaseService: DatabaseService, private cdr: ChangeDetectorRef) {
    this.databaseService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

getCurrentDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

setupIdentityVerification() {
  // Configurar subida de archivos para foto frontal
  this.setupFileUpload('idPhotoFront', 'frontPreview', 'frontFileName', 'removeFront');
  
  // Configurar subida de archivos para foto trasera
  this.setupFileUpload('idPhotoBack', 'backPreview', 'backFileName', 'removeBack');
  
  // Configurar validación del paso 0
  this.setupStep0Validation();
}

setupFileUpload(inputId: string, previewId: string, fileNameId: string, removeId: string) {
  const input = document.getElementById(inputId) as HTMLInputElement;
  const preview = document.getElementById(previewId);
  const previewImg = document.querySelector(`#${previewId} img`) as HTMLImageElement;
  const fileName = document.getElementById(fileNameId);
  const removeBtn = document.getElementById(removeId);
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  
  if (!input || !preview || !previewImg || !fileName || !removeBtn) return;
  
  // Crear mensaje de validación si no existe
  let validationMsg = document.getElementById(`${inputId}Validation`);
  if (!validationMsg) {
    validationMsg = document.createElement('span');
    validationMsg.id = `${inputId}Validation`;
    validationMsg.className = 'validation-msg';
    validationMsg.style.cssText = 'color:#b71c1c; font-size:12px; display:none; margin-top: 5px;';
    input.parentElement?.appendChild(validationMsg);
  }
  
  input.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (!file) {
      if (validationMsg) {
        validationMsg.style.display = 'none';
      }
      return;
    }
    
    // Validar tipo de archivo
    if (!allowedTypes.includes(file.type)) {
      const errorMsg = 'Solo se aceptan archivos JPG, JPEG o PNG';
      this.showMessage(errorMsg, 'error');
      if (validationMsg) {
        validationMsg.textContent = errorMsg;
        validationMsg.style.display = 'block';
        validationMsg.style.color = '#b71c1c';
      }
        input.value = '';
      preview.style.display = 'none';
      fileName.textContent = 'Seleccionar archivo';
      this.checkStep0Complete();
        return;
      }
      
    // Validar tamaño
    if (file.size > maxSize) {
      const errorMsg = `El archivo es demasiado grande (${(file.size / 1024 / 1024).toFixed(2)}MB). Máximo 5MB`;
      this.showMessage(errorMsg, 'error');
      if (validationMsg) {
        validationMsg.textContent = errorMsg;
        validationMsg.style.display = 'block';
        validationMsg.style.color = '#b71c1c';
      }
        input.value = '';
      preview.style.display = 'none';
      fileName.textContent = 'Seleccionar archivo';
      this.checkStep0Complete();
        return;
      }
      
    // Validar dimensiones mínimas (opcional, pero recomendado)
      const reader = new FileReader();
      reader.onload = (e) => {
      const result = e.target?.result;
      if (!result) {
        const errorMsg = 'Error al leer el archivo';
        this.showMessage(errorMsg, 'error');
        if (validationMsg) {
          validationMsg.textContent = errorMsg;
          validationMsg.style.display = 'block';
          validationMsg.style.color = '#b71c1c';
        }
        input.value = '';
        preview.style.display = 'none';
        fileName.textContent = 'Seleccionar archivo';
        this.checkStep0Complete();
        return;
      }
      
      const imageDataUrl = result as string;
      const img = new Image();
      img.onload = () => {
        // Validar que la imagen tenga dimensiones razonables (mínimo 200x200px)
        if (img.width < 200 || img.height < 200) {
          const errorMsg = 'La imagen es muy pequeña. Debe tener al menos 200x200 píxeles';
          this.showMessage(errorMsg, 'error');
          if (validationMsg) {
            validationMsg.textContent = errorMsg;
            validationMsg.style.display = 'block';
            validationMsg.style.color = '#b71c1c';
          }
          input.value = '';
          preview.style.display = 'none';
          fileName.textContent = 'Seleccionar archivo';
          this.checkStep0Complete();
          return;
        }
        
        // Todo válido
        previewImg.src = imageDataUrl;
          preview.style.display = 'block';
        fileName.textContent = `${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
        
        if (validationMsg) {
          validationMsg.textContent = '✓ Archivo válido';
          validationMsg.style.display = 'block';
          validationMsg.style.color = '#27ae60';
        }
        
          this.checkStep0Complete();
      };
      img.onerror = () => {
        const errorMsg = 'El archivo no es una imagen válida';
        this.showMessage(errorMsg, 'error');
        if (validationMsg) {
          validationMsg.textContent = errorMsg;
          validationMsg.style.display = 'block';
          validationMsg.style.color = '#b71c1c';
        }
        input.value = '';
        preview.style.display = 'none';
        fileName.textContent = 'Seleccionar archivo';
        this.checkStep0Complete();
      };
      img.src = imageDataUrl;
      };
      reader.readAsDataURL(file);
  });
  
  removeBtn.addEventListener('click', () => {
    input.value = '';
    preview.style.display = 'none';
    fileName.textContent = 'Seleccionar archivo';
    if (validationMsg) {
      validationMsg.style.display = 'none';
    }
    this.checkStep0Complete();
  });
}

setupStep0Validation() {
  const idType = document.getElementById('idType') as HTMLSelectElement;
  const idNumber = document.getElementById('idNumber') as HTMLInputElement;
  const frontFile = document.getElementById('idPhotoFront') as HTMLInputElement;
  const backFile = document.getElementById('idPhotoBack') as HTMLInputElement;
  const idValidation = document.getElementById('idValidation');
  
  if (idType) {
    idType.addEventListener('change', () => {
      this.validateIdNumber();
      this.checkStep0Complete();
    });
  }
  
  if (idNumber) {
    idNumber.addEventListener('input', () => {
      // Convertir a mayúsculas automáticamente
      idNumber.value = idNumber.value.toUpperCase();
      this.validateIdNumber();
      this.checkStep0Complete();
    });
    
    idNumber.addEventListener('blur', () => {
      this.validateIdNumber();
    });
  }
  
  // Las validaciones de archivos se manejan en setupFileUpload
}

validateIdNumber() {
  const idType = document.getElementById('idType') as HTMLSelectElement;
  const idNumber = document.getElementById('idNumber') as HTMLInputElement;
  const idValidation = document.getElementById('idValidation');
  
  if (!idType || !idNumber || !idValidation) return;
  
  const value = idNumber.value.trim();
  
  if (value.length === 0) {
    idValidation.style.display = 'none';
    idNumber.setCustomValidity('');
    return;
  }
  
  if (value.length < 5) {
    idValidation.textContent = 'El número de identificación debe tener al menos 5 caracteres';
    idValidation.style.display = 'block';
    idValidation.style.color = '#b71c1c';
    idNumber.setCustomValidity('Número de identificación inválido');
    return;
  }
  
  if (value.length > 20) {
    idValidation.textContent = 'El número de identificación no puede exceder 20 caracteres';
    idValidation.style.display = 'block';
    idValidation.style.color = '#b71c1c';
    idNumber.setCustomValidity('Número de identificación inválido');
    return;
  }
  
  // Validar que solo contenga letras y números
  if (!/^[A-Z0-9]+$/.test(value)) {
    idValidation.textContent = 'Solo se permiten letras mayúsculas y números';
    idValidation.style.display = 'block';
    idValidation.style.color = '#b71c1c';
    idNumber.setCustomValidity('Número de identificación inválido');
    return;
  }
  
  idValidation.textContent = '✓ Válido';
  idValidation.style.display = 'block';
  idValidation.style.color = '#27ae60';
  idNumber.setCustomValidity('');
}


checkStep0Complete() {
  const idType = document.getElementById('idType') as HTMLSelectElement;
  const idNumber = document.getElementById('idNumber') as HTMLInputElement;
  const frontFile = document.getElementById('idPhotoFront') as HTMLInputElement;
  const backFile = document.getElementById('idPhotoBack') as HTMLInputElement;
  const nextBtn = document.getElementById('nextToStep1') as HTMLButtonElement;
  
  if (!idType || !idNumber || !frontFile || !backFile || !nextBtn) return;
  
  const idTypeValid = idType.value && idType.value !== '';
  const idNumberValid = idNumber.value.length >= 5 && idNumber.value.length <= 20 && /^[A-Z0-9]+$/.test(idNumber.value);
  const frontFileValid = frontFile.files?.[0] && frontFile.files[0].size <= 5 * 1024 * 1024;
  const backFileValid = backFile.files?.[0] && backFile.files[0].size <= 5 * 1024 * 1024;
  
  const isValid = idTypeValid && idNumberValid && frontFileValid && backFileValid;
  
  nextBtn.disabled = !isValid;
  
  if (isValid) {
    nextBtn.classList.add('valid');
  } else {
    nextBtn.classList.remove('valid');
  }
}

showMessage(text: string, type: string = 'info', autoClose: boolean = true) {
  const popup = document.getElementById('messagePopup');
  const messageText = document.getElementById('messageText');
  
  if (!popup || !messageText) return;
  
  // Limpiar timeout anterior
  clearTimeout((window as any).messageTimeout);
  
  popup.className = `message-popup ${type}`;
  
  // Si el mensaje contiene HTML, usar innerHTML, sino textContent
  if (text.includes('<')) {
    messageText.innerHTML = text;
  } else {
  messageText.textContent = text;
  }
  
  const iconElement = popup.querySelector('.message-icon i');
  if (iconElement) {
    if (type === 'success') iconElement.className = 'fas fa-check-circle';
    else if (type === 'error') iconElement.className = 'fas fa-exclamation-triangle';
    else iconElement.className = 'fas fa-info-circle';
  }

  (popup as HTMLElement).style.display = 'flex';
  popup.classList.add('show');
  
  // Solo cerrar automáticamente si autoClose es true y el mensaje no es muy largo
  // Los mensajes con HTML largo (como Ayuda y Soporte) no se cierran automáticamente
  const isLongMessage = text.includes('<h2') || text.includes('<h3') || text.length > 200;
  
  if (autoClose && !isLongMessage) {
    (window as any).messageTimeout = setTimeout(() => {
      if (popup) {
        (popup as HTMLElement).style.display = 'none';
    popup.classList.remove('show');
      }
    }, 5000);
  } else {
    // Para mensajes largos, no cerrar automáticamente
    (window as any).messageTimeout = null;
  }
}

setupStepNavigation() {
  // Variables para control de pasos
  let currentStep = 0;
  const steps = ['step0', 'step1', 'step2', 'step3'];
  
  // Función para actualizar la barra de progreso
  const updateProgressBar = () => {
    document.querySelectorAll('.progress-step').forEach((step, index) => {
      step.classList.toggle('active', index <= currentStep);
    });
  };
  
  // Función para navegar a un paso específico
  const goToStep = (stepIndex: number) => {
    document.querySelectorAll('.form-step').forEach(step => {
      step.classList.remove('active');
    });
    
    const targetStep = document.getElementById(steps[stepIndex]);
    if (targetStep) {
      targetStep.classList.add('active');
      currentStep = stepIndex;
      updateProgressBar();
    }
  };
  
  // Event listeners para navegación entre pasos
  const nextToStep1 = document.getElementById('nextToStep1');
  const backToStep0 = document.getElementById('backToStep0');
  const nextToStep2 = document.getElementById('nextToStep2');
  const backToStep1 = document.getElementById('backToStep1');
  const nextToStep3 = document.getElementById('nextToStep3');
  const backToStep2 = document.getElementById('backToStep2');
  
  if (nextToStep1) nextToStep1.addEventListener('click', () => goToStep(1));
  if (backToStep0) backToStep0.addEventListener('click', () => goToStep(0));
  if (nextToStep2) nextToStep2.addEventListener('click', () => goToStep(2));
  if (backToStep1) backToStep1.addEventListener('click', () => goToStep(1));
  if (nextToStep3) nextToStep3.addEventListener('click', () => goToStep(3));
  if (backToStep2) backToStep2.addEventListener('click', () => goToStep(2));
}

setupFormValidations() {
  // Validación del Paso 1 (Datos Personales)
  this.setupStep1Validation();
  
  // Validación del Paso 2 (Contraseñas)
  this.setupStep2Validation();
  
  // Validación del Paso 3 (Información Adicional)
  this.setupStep3Validation();
}

setupStep1Validation() {
  const nameInput = document.getElementById('signupName') as HTMLInputElement;
  const emailInput = document.getElementById('signupEmail') as HTMLInputElement;
  const nextBtn = document.getElementById('nextToStep2') as HTMLButtonElement;
  const nameValidation = document.getElementById('nameValidation');
  const emailValidation = document.getElementById('emailValidation');
  
  if (!nameInput || !emailInput || !nextBtn) return;
  
  const validateName = () => {
    const value = nameInput.value.trim();
    
    if (value.length === 0) {
      if (nameValidation) {
        nameValidation.style.display = 'none';
      }
      nameInput.setCustomValidity('');
      return false;
    }
    
    if (value.length < 3) {
      if (nameValidation) {
        nameValidation.textContent = 'El nombre debe tener al menos 3 caracteres';
        nameValidation.style.display = 'block';
        nameValidation.style.color = '#b71c1c';
      }
      nameInput.setCustomValidity('Nombre inválido');
      return false;
    }
    
    if (value.length > 100) {
      if (nameValidation) {
        nameValidation.textContent = 'El nombre no puede exceder 100 caracteres';
        nameValidation.style.display = 'block';
        nameValidation.style.color = '#b71c1c';
      }
      nameInput.setCustomValidity('Nombre inválido');
      return false;
    }
    
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(value)) {
      if (nameValidation) {
        nameValidation.textContent = 'Solo se permiten letras y espacios';
        nameValidation.style.display = 'block';
        nameValidation.style.color = '#b71c1c';
      }
      nameInput.setCustomValidity('Nombre inválido');
      return false;
    }
    
    if (nameValidation) {
      nameValidation.textContent = '✓ Válido';
      nameValidation.style.display = 'block';
      nameValidation.style.color = '#27ae60';
    }
    nameInput.setCustomValidity('');
    return true;
  };
  
  const validateEmail = () => {
    const value = emailInput.value.trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (value.length === 0) {
      if (emailValidation) {
        emailValidation.style.display = 'none';
      }
      emailInput.setCustomValidity('');
      return false;
    }
    
    if (!emailRegex.test(value)) {
      if (emailValidation) {
        emailValidation.textContent = 'Ingresa un correo electrónico válido';
        emailValidation.style.display = 'block';
        emailValidation.style.color = '#b71c1c';
      }
      emailInput.setCustomValidity('Email inválido');
      return false;
    }
    
    // Validar dominio común
    const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
    const domain = value.split('@')[1]?.toLowerCase();
    if (domain && !commonDomains.includes(domain) && !domain.includes('.')) {
      if (emailValidation) {
        emailValidation.textContent = 'El dominio del correo parece inválido';
        emailValidation.style.display = 'block';
        emailValidation.style.color = '#f39c12';
      }
    } else {
      if (emailValidation) {
        emailValidation.textContent = '✓ Válido';
        emailValidation.style.display = 'block';
        emailValidation.style.color = '#27ae60';
      }
    }
    
    emailInput.setCustomValidity('');
    return emailRegex.test(value);
  };
  
  const validateStep1 = () => {
    const nameValid = validateName();
    const emailValid = validateEmail();
    
    nextBtn.disabled = !(nameValid && emailValid);
    
    if (nameValid && emailValid) {
      nextBtn.classList.add('valid');
    } else {
      nextBtn.classList.remove('valid');
    }
  };
  
  nameInput.addEventListener('input', validateStep1);
  nameInput.addEventListener('blur', validateName);
  emailInput.addEventListener('input', validateStep1);
  emailInput.addEventListener('blur', validateEmail);
}

setupStep2Validation() {
  const passwordInput = document.getElementById('signupPassword') as HTMLInputElement;
  const confirmPasswordInput = document.getElementById('signupConfirmPassword') as HTMLInputElement;
  const nextBtn = document.getElementById('nextToStep3') as HTMLButtonElement;
  
  if (!passwordInput || !confirmPasswordInput || !nextBtn) return;
  
  // Validación de fortaleza de contraseña
  passwordInput.addEventListener('input', () => {
    this.checkPasswordStrength(passwordInput.value);
    this.checkPasswordsMatch();
  });
  
  confirmPasswordInput.addEventListener('input', () => {
    this.checkPasswordsMatch();
  });
}

checkPasswordStrength(password: string) {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[@$!%*?&]/.test(password)
  };
  
  // Actualizar indicadores visuales
  const reqElements = {
    length: document.getElementById('req-length'),
    uppercase: document.getElementById('req-uppercase'),
    lowercase: document.getElementById('req-lowercase'),
    number: document.getElementById('req-number'),
    special: document.getElementById('req-special')
  };
  
  Object.keys(requirements).forEach(req => {
    const element = reqElements[req as keyof typeof reqElements];
    if (element) {
      element.classList.toggle('valid', requirements[req as keyof typeof requirements]);
    }
  });
  
  // Actualizar barra de fortaleza
  const strengthDiv = document.getElementById('passwordStrength');
  const strengthBar = document.getElementById('strengthBarFill');
  const strengthText = document.getElementById('strengthText');
  
  if (!strengthDiv || !strengthBar || !strengthText) return;
  
  const strength = Object.values(requirements).filter(Boolean).length;
  
  if (password.length > 0) {
    strengthDiv.style.display = 'block';
    const percentage = (strength / 5) * 100;
    strengthBar.style.width = percentage + '%';
    
    if (strength <= 2) {
      strengthBar.style.background = '#e74c3c';
      strengthText.textContent = 'Débil';
      strengthText.style.color = '#e74c3c';
    } else if (strength <= 3) {
      strengthBar.style.background = '#f39c12';
      strengthText.textContent = 'Media';
      strengthText.style.color = '#f39c12';
    } else if (strength <= 4) {
      strengthBar.style.background = '#3498db';
      strengthText.textContent = 'Buena';
      strengthText.style.color = '#3498db';
    } else {
      strengthBar.style.background = '#27ae60';
      strengthText.textContent = 'Excelente';
      strengthText.style.color = '#27ae60';
    }
  } else {
    strengthDiv.style.display = 'none';
  }
}

checkPasswordsMatch() {
  const passwordInput = document.getElementById('signupPassword') as HTMLInputElement;
  const confirmPasswordInput = document.getElementById('signupConfirmPassword') as HTMLInputElement;
  const matchMsg = document.getElementById('passwordMatchValidation');
  const nextBtn = document.getElementById('nextToStep3') as HTMLButtonElement;
  
  if (!passwordInput || !confirmPasswordInput || !matchMsg || !nextBtn) return;
  
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;
  
  // Verificar requisitos de contraseña
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[@$!%*?&]/.test(password)
  };
  
  const allReqMet = Object.values(requirements).every(req => req);
  
  if (confirmPassword.length > 0) {
    if (password !== confirmPassword) {
      matchMsg.textContent = 'Las contraseñas no coinciden';
      matchMsg.style.color = '#b71c1c';
      matchMsg.style.display = 'block';
      nextBtn.disabled = true;
    } else if (!allReqMet) {
      matchMsg.textContent = 'La contraseña no cumple todos los requisitos';
      matchMsg.style.color = '#b71c1c';
      matchMsg.style.display = 'block';
      nextBtn.disabled = true;
    } else {
      matchMsg.textContent = '✓ Las contraseñas coinciden';
      matchMsg.style.color = '#27ae60';
      matchMsg.style.display = 'block';
      nextBtn.disabled = false;
    }
  } else {
    matchMsg.style.display = 'none';
    nextBtn.disabled = true;
  }
}

setupStep3Validation() {
  const ageInput = document.getElementById('signupAge') as HTMLInputElement;
  const phoneInput = document.getElementById('signupPhone') as HTMLInputElement;
  const addressInput = document.getElementById('signupAddress') as HTMLTextAreaElement;
  const confirmAgeCheckbox = document.getElementById('confirmLegalAge') as HTMLInputElement;
  const acceptTermsCheckbox = document.getElementById('acceptTerms') as HTMLInputElement;
  const submitBtn = document.getElementById('submitSignup') as HTMLButtonElement;
  const phoneValidation = document.getElementById('phoneValidation');
  const addressValidation = document.getElementById('addressValidation');
  
  if (!ageInput || !phoneInput || !addressInput || !confirmAgeCheckbox || !acceptTermsCheckbox || !submitBtn) return;
  
  // Configurar fecha máxima (hoy) y mínima (100 años atrás)
  const today = new Date();
  const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
  
  ageInput.max = maxDate.toISOString().split('T')[0];
  ageInput.min = minDate.toISOString().split('T')[0];
  
  const validateAge = () => {
    if (!ageInput.value) {
      const ageMsg = document.getElementById('ageValidationMsg');
      if (ageMsg) ageMsg.style.display = 'none';
      ageInput.setCustomValidity('');
      return false;
    }
    
    const birthDate = new Date(ageInput.value);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    const ageValid = age >= 18;
    const ageMsg = document.getElementById('ageValidationMsg');
    
    if (ageValid) {
      if (ageMsg) ageMsg.style.display = 'none';
      ageInput.setCustomValidity('');
    } else {
    if (ageMsg) {
        ageMsg.style.display = 'block';
        ageMsg.textContent = `Debes ser mayor de 18 años para registrarte. Edad calculada: ${age} años`;
      }
      ageInput.setCustomValidity('Debes ser mayor de 18 años');
    }
    
    return ageValid;
  };
  
  const validatePhone = () => {
    const value = phoneInput.value.trim();
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
    
    if (value.length === 0) {
      if (phoneValidation) {
        phoneValidation.style.display = 'none';
      }
      phoneInput.setCustomValidity('');
      return false;
    }
    
    if (value.length < 10) {
      if (phoneValidation) {
        phoneValidation.textContent = 'El teléfono debe tener al menos 10 dígitos';
        phoneValidation.style.display = 'block';
        phoneValidation.style.color = '#b71c1c';
      }
      phoneInput.setCustomValidity('Teléfono inválido');
      return false;
    }
    
    if (value.length > 15) {
      if (phoneValidation) {
        phoneValidation.textContent = 'El teléfono no puede exceder 15 caracteres';
        phoneValidation.style.display = 'block';
        phoneValidation.style.color = '#b71c1c';
      }
      phoneInput.setCustomValidity('Teléfono inválido');
      return false;
    }
    
    if (!phoneRegex.test(value)) {
      if (phoneValidation) {
        phoneValidation.textContent = 'Formato de teléfono inválido. Ejemplo: +52 123 456 7890';
        phoneValidation.style.display = 'block';
        phoneValidation.style.color = '#b71c1c';
      }
      phoneInput.setCustomValidity('Teléfono inválido');
      return false;
    }
    
    if (phoneValidation) {
      phoneValidation.textContent = '✓ Válido';
      phoneValidation.style.display = 'block';
      phoneValidation.style.color = '#27ae60';
    }
    phoneInput.setCustomValidity('');
    return true;
  };
  
  const validateAddress = () => {
    const value = addressInput.value.trim();
    
    if (value.length === 0) {
      if (addressValidation) {
        addressValidation.style.display = 'none';
      }
      addressInput.setCustomValidity('');
      return false;
    }
    
    if (value.length < 10) {
      if (addressValidation) {
        addressValidation.textContent = 'La dirección debe tener al menos 10 caracteres';
        addressValidation.style.display = 'block';
        addressValidation.style.color = '#b71c1c';
      }
      addressInput.setCustomValidity('Dirección inválida');
      return false;
    }
    
    if (value.length > 200) {
      if (addressValidation) {
        addressValidation.textContent = 'La dirección no puede exceder 200 caracteres';
        addressValidation.style.display = 'block';
        addressValidation.style.color = '#b71c1c';
      }
      addressInput.setCustomValidity('Dirección inválida');
      return false;
    }
    
    // Validar que tenga al menos calle y número
    const hasStreet = /\d+/.test(value); // Tiene números
    const hasText = /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(value); // Tiene letras
    
    if (!hasStreet || !hasText) {
      if (addressValidation) {
        addressValidation.textContent = 'La dirección debe incluir calle y número';
        addressValidation.style.display = 'block';
        addressValidation.style.color = '#f39c12';
      }
    } else {
      if (addressValidation) {
        addressValidation.textContent = '✓ Válido';
        addressValidation.style.display = 'block';
        addressValidation.style.color = '#27ae60';
      }
    }
    
    addressInput.setCustomValidity('');
    return value.length >= 10 && value.length <= 200;
  };
  
  const validateStep3 = () => {
    const ageValid = validateAge();
    const phoneValid = validatePhone();
    const addressValid = validateAddress();
    const confirmAgeValid = confirmAgeCheckbox.checked;
    const acceptTermsValid = acceptTermsCheckbox.checked;
    
    const allValid = ageValid && phoneValid && addressValid && confirmAgeValid && acceptTermsValid;
    
    submitBtn.disabled = !allValid;
    
    if (allValid) {
      submitBtn.classList.add('valid');
    } else {
      submitBtn.classList.remove('valid');
    }
  };
  
  ageInput.addEventListener('change', validateStep3);
  ageInput.addEventListener('blur', validateAge);
  phoneInput.addEventListener('input', validateStep3);
  phoneInput.addEventListener('blur', validatePhone);
  addressInput.addEventListener('input', validateStep3);
  addressInput.addEventListener('blur', validateAddress);
  confirmAgeCheckbox.addEventListener('change', validateStep3);
  acceptTermsCheckbox.addEventListener('change', validateStep3);
}

setupPasswordToggles() {
  const passwordToggles = document.querySelectorAll('.password-toggle');
  
  passwordToggles.forEach(toggle => {
    toggle.addEventListener('click', function(this: HTMLElement) {
      const input = this.previousElementSibling as HTMLInputElement;
      const icon = this.querySelector('i');
      
      if (input && icon) {
        if (input.type === 'password') {
          input.type = 'text';
          icon.className = 'fas fa-eye-slash';
        } else {
          input.type = 'password';
          icon.className = 'fas fa-eye';
        }
      }
    });
  });
}

  ngOnInit() {
    // Verificar si estamos en el navegador (no en SSR)
    if (typeof window === 'undefined') {
      return;
    }

    // Estado global de la aplicación
    let userPoints = 1250;
    let cart: any[] = [];
    let appliedDiscount = 0;
    let pointsUsed = 0;
    let filteredBeers: any[] = [];

    // Función helper para validar y normalizar URLs de imágenes
    const normalizeImageUrl = (url: string | null | undefined, defaultText: string = 'Cerveza', size: string = '280x200'): string => {
      if (!url || typeof url !== 'string' || url.trim() === '') {
        return `https://via.placeholder.com/${size}/EEE/333?text=${encodeURIComponent(defaultText)}`;
      }
      
      // Limpiar espacios en blanco
      const originalUrl = url;
      url = url.trim();
      
      // Debug: solo loggear URLs problemáticas
      if (url.includes('via.placeholder.com') && !url.startsWith('https://') && !url.startsWith('http://')) {
        console.log('🔍 URL sin protocolo detectada:', originalUrl);
      }
      
      // Si la URL ya es completa (comienza con http:// o https://), retornarla (después de limpiar :1 si existe)
      if (url.startsWith('http://') || url.startsWith('https://')) {
        // Remover ":1" del final del texto si existe en URLs completas también
        url = url.replace(/(\?text=[^&]+):\d+($|&)/, '$1$2');
        return url;
      }
      
      // Si contiene "via.placeholder.com" sin protocolo, agregar https://
      if (url.includes('via.placeholder.com')) {
        // Remover ":1" del final del texto si existe (múltiples formatos)
        url = url.replace(/(\?text=[^&]+):\d+($|&)/, '$1$2');
        url = url.replace(/(\?text=[^:]+):\d+$/, '$1'); // Para casos como ?text=IPA:1 al final
        // Asegurar que tenga https://
        if (!url.startsWith('https://') && !url.startsWith('http://')) {
          url = `https://${url}`;
        }
        return url;
      }
      
      // Si es un fragmento de URL de placeholder (como "000000?text=IPA:1"), construir la URL completa
      // Detectar patrones como "000000?text=IPA:1" o "FFFFFF?text=Stout:1"
      const fragmentMatch = url.match(/^([0-9A-Fa-f]{6})\?text=(.+)$/);
      if (fragmentMatch) {
        const bgColor = fragmentMatch[1];
        const text = fragmentMatch[2].replace(/:\d+$/, ''); // Remover ":1" al final si existe
        return `https://via.placeholder.com/${size}/${bgColor}/FFFFFF?text=${encodeURIComponent(text)}`;
      }
      
      // Si contiene "?text=" pero no tiene el dominio, intentar construir la URL
      if (url.includes('?text=')) {
        const parts = url.split('?text=');
        if (parts.length === 2) {
          const text = parts[1].replace(/:\d+$/, ''); // Remover ":1" al final si existe
          return `https://via.placeholder.com/${size}/EEE/333?text=${encodeURIComponent(text)}`;
        }
      }
      
      // Si parece ser una URL de placeholder sin protocolo (contiene /280x200/ o similar)
      if (url.includes('/280x200/') || url.includes('/50x50/') || url.includes('/40x40/') || url.includes('/100x100/')) {
        return `https://${url}`;
      }
      
      // Si no coincide con ningún patrón, usar el placeholder por defecto
      return `https://via.placeholder.com/${size}/EEE/333?text=${encodeURIComponent(defaultText)}`;
    };

    // Hacer la función disponible globalmente para uso en funciones como manageStock
    (window as any).normalizeImageUrl = normalizeImageUrl;

    // Datos de ejemplo para las cervezas
    let beerData = [
      {
        id: 1,
        name: "IPA Artesanal",
        style: "India Pale Ale",
        description: "Cerveza con alto contenido de lúpulo, amargor intenso y un aroma cítrico y floral. Ideal para paladares atrevidos.",
        price: 5.99,
        points: 60,
        image: "https://via.placeholder.com/280x200/FFD700/000000?text=IPA"
      },
      {
        id: 2,
        name: "Stout Premium",
        style: "Imperial Stout",
        description: "Cerveza oscura con notas profundas de café tostado, chocolate negro y un final sedoso. Perfecta para el invierno.",
        price: 6.50,
        points: 65,
        image: "https://via.placeholder.com/280x200/8B4513/FFFFFF?text=Stout"
      },
      {
        id: 3,
        name: "Trigo Fresco",
        style: "Weissbier",
        description: "Cerveza de trigo, turbia y refrescante, con sabores afrutados a plátano y clavo. Perfecta para un día soleado.",
        price: 4.99,
        points: 50,
        image: "https://via.placeholder.com/280x200/FFA500/000000?text=Trigo"
      },
      {
        id: 4,
        name: "Ámbar Especial",
        style: "Red Ale",
        description: "Cerveza ámbar con un equilibrio perfecto entre maltas acarameladas y un amargor suave. Un clásico inconfundible.",
        price: 5.25,
        points: 53,
        image: "https://via.placeholder.com/280x200/DC2626/FFFFFF?text=Ambar"
      },
      {
        id: 5,
        name: "Lager Dorada",
        style: "Premium Lager",
        description: "Cerveza clara y refrescante con un sabor limpio y equilibrado. Perfecta para cualquier ocasión.",
        price: 4.50,
        points: 45,
        image: "https://via.placeholder.com/280x200/FFD700/000000?text=Lager"
      },
      {
        id: 6,
        name: "Porter Ahumada",
        style: "Smoked Porter",
        description: "Cerveza oscura con matices ahumados y notas de malta tostada. Una experiencia única para el paladar.",
        price: 7.25,
        points: 73,
        image: "https://via.placeholder.com/280x200/4A4A4A/FFFFFF?text=Porter"
      }
    ];

    // Datos de ejemplo para pedidos (actualizados con puntos)
    const ordersData = [
      {
        id: "12345",
        date: "15 Oct 2023",
        status: "delivered",
        total: "$24.97",
        pointsEarned: 125,
        items: ["IPA Artesanal x2", "Stout Premium x1"]
      },
      {
        id: "12346",
        date: "20 Oct 2023",
        status: "pending",
        total: "$32.50",
        pointsEarned: 163,
        items: ["Ámbar Especial x3", "Trigo Fresco x2"]
      },
      {
        id: "12347",
        date: "5 Nov 2023",
        status: "cancelled",
        total: "$16.50",
        pointsEarned: 0,
        items: ["Stout Premium x2", "Trigo Fresco x1"]
      }
    ];

    // Funcionalidad de la aplicación
    setTimeout(() => {
      const self: AppComponent = this;
      
      // Función centralizada para cerrar todos los modales (definida temprano para uso global)
      const closeAllModals = () => {
        const modals = ['beerModal', 'stockModal', 'notificationModal', 'discountModal', 'repartidorModal'];
        modals.forEach(modalId => {
          const modal = document.getElementById(modalId);
          if (modal) modal.style.display = 'none';
        });
        
        // Cerrar también el messagePopup (islas flotantes)
        const messagePopup = document.getElementById('messagePopup');
        if (messagePopup) {
          (messagePopup as HTMLElement).style.display = 'none';
          messagePopup.classList.remove('show');
          clearTimeout((window as any).messageTimeout);
        }
        
        // Cerrar también modales de detalles de cerveza
        const beerDetailsModals = document.querySelectorAll('.beer-details-modal');
        beerDetailsModals.forEach(modal => {
          (modal as HTMLElement).remove();
        });
      };
      
      // Hacer la función disponible globalmente
      (window as any).closeAllModals = closeAllModals;
      
      // Elementos de la interfaz
      const views = {
        login: document.getElementById('loginView'),
        signup: document.getElementById('signupView'),
        dashboard: document.getElementById('dashboardView'),
        catalog: document.getElementById('catalogView'),
        cart: document.getElementById('cartView'),
        profile: document.getElementById('profileView'),
        orders: document.getElementById('ordersView'),
        forgotPassword: document.getElementById('forgotPasswordView'),
        resetPassword: document.getElementById('resetPasswordView'),
        adminLogin: document.getElementById('adminLoginView'),
        adminDashboard: document.getElementById('adminDashboardView'),
        favorites: document.getElementById('favoritesView'),
        addresses: document.getElementById('addressesView'),
        notifications: document.getElementById('notificationsView'),
        settings: document.getElementById('settingsView'),
        recommendations: document.getElementById('recommendationsView')
      };
      
      const messagePopup = document.getElementById('messagePopup');
      const messageText = document.getElementById('messageText');
      
      // Funcionalidad del Paso 0: Verificación de Identidad
      this.setupIdentityVerification();
      
      // Configurar navegación entre pasos del registro
      this.setupStepNavigation();
      
      // Configurar validaciones de todos los pasos
      this.setupFormValidations();
      
      // Configurar toggle de contraseñas
      this.setupPasswordToggles();
      
      // Botones de navegación
      const navButtons = {
        showSignup: document.getElementById('showSignup'),
        backToLogin: document.getElementById('backToLogin'),
        showCatalog: document.getElementById('showCatalog'),
        showCart: document.getElementById('showCart'),
        showOrders: document.getElementById('showOrders'),
        showProfile: document.getElementById('showProfile'),
        showAdminPanel: document.getElementById('showAdminPanel'),
        logout: document.getElementById('logoutBtn'),
        backToDashboard: document.getElementById('backToDashboard'),
        backToDashboardFromProfile: document.getElementById('backToDashboardFromProfile'),
        backToDashboardFromOrders: document.getElementById('backToDashboardFromOrders'),
        backToDashboardFromCart: document.getElementById('backToDashboardFromCart'),
        goToCart: document.getElementById('goToCart'),
        continueShopping: document.getElementById('continueShopping'),
        closeMessage: document.getElementById('closeMessage')
      };
      
      // Formularios
      const forms = {
        login: document.getElementById('loginForm'),
        signup: document.getElementById('signupForm'),
        profile: document.querySelector('.profile-form')
      };
      
      // Contenedores de datos
      const containers = {
        beerGrid: document.querySelector('.beer-grid'),
        ordersList: document.querySelector('.orders-list'),
        cartItems: document.getElementById('cartItems'),
        cartBadge: document.getElementById('cartBadge'),
        catalogCartBadge: document.getElementById('catalogCartBadge')
      };
      
      // Función para mostrar vista específica
      function showView(view: any) {
        if (!view) {
          console.warn('Vista no encontrada');
          return false;
        }
        
        // Ocultar todas las vistas
        Object.values(views).forEach((v: any) => {
          if (v && v.classList) {
            v.classList.remove('active');
            v.style.display = 'none';
          }
        });
        
        // Mostrar la vista seleccionada
        if (view.classList) {
          view.classList.add('active');
          view.style.display = 'block';
          
          // Scroll al inicio
          setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }, 100);
          
          return true;
        }
        return false;
      }
      
      // Guardar referencias para acceso desde métodos públicos
      self.showViewFn = showView;
      self.views = views;
      
      // Función para mostrar mensaje (Popup)
      function showMessage(message: string, type = 'info', autoClose: boolean = true) {
        if (!messagePopup || !messageText) {
          console.warn('Elementos de mensaje no encontrados');
          return;
        }
        
        // Limpiar timeout anterior
        clearTimeout((window as any).messageTimeout);
        
        messagePopup.className = `message-popup ${type}`;
        
        // Si el mensaje contiene HTML, usar innerHTML, sino textContent
        if (message.includes('<')) {
          messageText.innerHTML = message;
        } else {
          messageText.textContent = message;
        }
        
        const iconElement = messagePopup.querySelector('.message-icon i');
        if (iconElement) {
          if (type === 'success') iconElement.className = 'fas fa-check-circle';
          else if (type === 'error') iconElement.className = 'fas fa-exclamation-triangle';
          else iconElement.className = 'fas fa-info-circle';
        }

        (messagePopup as HTMLElement).style.display = 'flex';
        messagePopup.classList.add('show');
        
        // Solo cerrar automáticamente si autoClose es true y el mensaje no es muy largo
        // Los mensajes con HTML largo (como Ayuda y Soporte) no se cierran automáticamente
        const isLongMessage = message.includes('<h2') || message.includes('<h3') || message.length > 200;
        
        if (autoClose && !isLongMessage) {
          (window as any).messageTimeout = setTimeout(() => {
            if (messagePopup) {
              (messagePopup as HTMLElement).style.display = 'none';
              messagePopup.classList.remove('show');
            }
          }, 5000);
        } else {
          // Para mensajes largos, no cerrar automáticamente
          (window as any).messageTimeout = null;
        }
      }
      
      // Funciones del carrito
      function updateCartBadges() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        const badges = [containers.cartBadge, containers.catalogCartBadge];
        
        badges.forEach(badge => {
          if (badge) {
            if (totalItems > 0) {
              badge.textContent = totalItems.toString();
              (badge as HTMLElement).style.display = 'flex';
            } else {
              (badge as HTMLElement).style.display = 'none';
            }
          }
        });
      }
      
      function addToCart(beerId: number, quantity = 1) {
        const beer = beerData.find(b => b.id === beerId);
        if (!beer || !self.currentUser) return;
        
        // Encontrar el botón correspondiente
        let button = document.querySelector(`button[data-beer-id="${beerId}"]`) as HTMLButtonElement;
        if (!button) {
          // Fallback: buscar por onclick
          const buttons = Array.from(document.querySelectorAll('.add-to-cart')) as HTMLButtonElement[];
          button = buttons.find(btn => btn.getAttribute('onclick')?.includes(`addToCart(${beerId})`)) || buttons[0];
        }
        
        let span: HTMLSpanElement | null = null;
        if (button) {
          // Agregar estado de carga
          button.classList.add('loading');
          button.disabled = true;
          
          // Ocultar texto y mostrar solo el icono durante la carga
          span = button.querySelector('span');
          if (span) span.style.opacity = '0';
        }
        
        const existingItem = cart.find(item => item.id === beerId);
        
        if (existingItem) {
          existingItem.quantity += quantity;
        } else {
          cart.push({
            ...beer,
            quantity: quantity
          });
        }
        
        // Guardar en backend
        self.databaseService.addToCarrito(self.currentUser.id!, beerId, existingItem ? existingItem.quantity : quantity).subscribe({
          next: () => {
            updateCartBadges();
            showMessage(`${beer.name} añadida al carrito! 🍻`, 'success');
            
            // Recargar carrito si está visible
            const cartView = document.getElementById('cartView');
            if (cartView && cartView.classList.contains('active')) {
              // Si el carrito está visible, recargarlo desde el backend
              if (self.renderCartFn) {
                setTimeout(() => {
                  self.renderCartFn!();
                }, 300);
              }
            }
            
            // Mostrar estado de éxito
            if (button) {
              button.classList.remove('loading');
              button.classList.add('success');
              
              // Cambiar icono a check
              const icon = button.querySelector('i');
              if (icon) {
                icon.className = 'fas fa-check';
              }
              
              // Restaurar texto después de un momento
              setTimeout(() => {
                if (button) {
                  button.classList.remove('success');
                  button.disabled = false;
                  
                  const icon = button.querySelector('i');
                  if (icon) {
                    icon.className = 'fas fa-shopping-cart';
                  }
                  if (span) {
                    span.style.opacity = '1';
                  }
                }
              }, 2000);
            }
          },
          error: () => {
            showMessage('Error al agregar al carrito', 'error');
            
            // Restaurar botón en caso de error
            if (button) {
              button.classList.remove('loading', 'success');
              button.disabled = false;
              
              const spanElement = button.querySelector('span');
              const icon = button.querySelector('i');
              if (spanElement) spanElement.style.opacity = '1';
              if (icon) icon.className = 'fas fa-shopping-cart';
            }
          }
        });
      }
      
      function removeFromCart(beerId: number) {
        if (!self.currentUser) return;
        
        const cartItem = cart.find(item => item.id === beerId);
        if (!cartItem) return;
        
        // Eliminar del backend usando el cartItemId
        self.databaseService.removeFromCarrito(cartItem.cartItemId).subscribe({
          next: () => {
            cart = cart.filter(item => item.id !== beerId);
            updateCartBadges();
            renderCart();
          },
          error: () => showMessage('Error al eliminar del carrito', 'error')
        });
      }
      
      function updateQuantity(beerId: number, newQuantity: number) {
        if (!self.currentUser) return;
        
        const item = cart.find(item => item.id === beerId);
        if (item) {
          if (newQuantity <= 0) {
            removeFromCart(beerId);
          } else {
            item.quantity = newQuantity;
            
            // Actualizar en backend usando el cartItemId
            self.databaseService.updateCarritoItem(item.cartItemId, newQuantity).subscribe({
              next: () => {
                renderCart();
                updateCartBadges();
              },
              error: () => showMessage('Error al actualizar cantidad', 'error')
            });
          }
        }
      }
      
      // Variables para entrega a domicilio
      let deliveryMethod = 'pickup'; // 'pickup' o 'delivery'
      let deliveryAddress: any = null;
      let selectedTiendaId: number | null = null;
      let shippingCost = 0;
      let tiendasCache: any[] = [];

      function calculateCartTotals() {
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Calcular costo de envío basado en el método de entrega
        let shipping = 0;
        if (deliveryMethod === 'delivery') {
          shipping = calculateShippingCost(subtotal, deliveryAddress);
        }
        
        const pointsToEarn = Math.floor(subtotal * 5); // 5 puntos por dólar
        const total = subtotal - appliedDiscount + shipping;
        
        return { subtotal, shipping, pointsToEarn, total };
      }

      function calculateShippingCost(subtotal: number, address: any): number {
        // Configuración desde el admin (estos valores deberían venir de la BD)
        const freeShippingFrom = 500; // Envío gratis desde $500
        const baseShippingCost = 50; // Costo base $50
        const minOrderAmount = 100; // Pedido mínimo $100
        
        // Verificar pedido mínimo
        if (subtotal < minOrderAmount) {
          return 0; // No permitir si es menor al mínimo
        }
        
        // Envío gratis si supera el monto
        if (subtotal >= freeShippingFrom) {
          return 0;
        }
        
        // Costo base más cargo adicional por zona
        let cost = baseShippingCost;
        
        // Agregar costo adicional según código postal (ejemplo)
        if (address && address.postalCode) {
          const postalCode = parseInt(address.postalCode);
          
          // Zona Centro (01000-01999) - Sin cargo adicional
          if (postalCode >= 1000 && postalCode < 2000) {
            cost += 0;
          }
          // Zona Norte (02000-02999) - $30 adicional
          else if (postalCode >= 2000 && postalCode < 3000) {
            cost += 30;
          }
          // Zona Sur (03000-03999) - $20 adicional
          else if (postalCode >= 3000 && postalCode < 4000) {
            cost += 20;
          }
          // Otras zonas - $40 adicional
          else {
            cost += 40;
          }
        }
        
        return cost;
      }

      // Variables globales para Leaflet (OpenStreetMap)
      let deliveryMap: any = null;
      let deliveryMarker: any = null;
      let searchTimeout: any = null;

      // Función para geocodificación inversa usando Nominatim (gratuito)
      function reverseGeocode(lat: number, lng: number, callback: (address: any) => void) {
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=es`)
          .then(response => response.json())
          .then(data => {
            if (data && data.address) {
              callback(data);
            }
          })
          .catch(error => {
            console.error('Error en geocodificación inversa:', error);
          });
      }

      // Función para buscar direcciones usando Nominatim
      function searchAddresses(query: string, callback: (results: any[]) => void) {
        if (searchTimeout) {
          clearTimeout(searchTimeout);
        }
        
        searchTimeout = setTimeout(() => {
          if (query.length < 3) {
            callback([]);
            return;
          }
          
          fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=mx&limit=5&addressdetails=1&accept-language=es`)
            .then(response => response.json())
            .then(data => {
              callback(data || []);
            })
            .catch(error => {
              console.error('Error en búsqueda de direcciones:', error);
              callback([]);
            });
        }, 500);
      }

      function initLeafletMap() {
        // Verificar si el mapa ya está inicializado
        if (deliveryMap) {
          // Si el mapa ya existe, solo actualizar su tamaño
          try {
            deliveryMap.invalidateSize();
          } catch (e) {
            console.warn('Error al actualizar tamaño del mapa:', e);
          }
          return;
        }

        // Verificar si Leaflet está cargado
        if (typeof (window as any).L === 'undefined') {
          console.warn('Leaflet no está cargado. Esperando...');
          
          const mapContainer = document.getElementById('deliveryMap');
          if (mapContainer) {
            mapContainer.innerHTML = `
              <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 20px; text-align: center; color: #ecf0f1;">
                <i class="fas fa-map-marked-alt" style="font-size: 48px; color: #fdbb2d; margin-bottom: 15px; animation: pulse 2s infinite;"></i>
                <h3 style="margin: 0 0 10px 0; color: #ecf0f1;">Cargando mapa...</h3>
                <p style="margin: 0; color: #bdc3c7; font-size: 0.9rem;">Por favor espera mientras se carga el mapa</p>
              </div>
              <style>
                @keyframes pulse {
                  0%, 100% { opacity: 1; }
                  50% { opacity: 0.5; }
                }
              </style>
            `;
          }
          
          let attempts = 0;
          const maxAttempts = 10;
          
          const tryInit = () => {
            attempts++;
            if (typeof (window as any).L !== 'undefined') {
              initLeafletMap();
            } else if (attempts < maxAttempts) {
              setTimeout(tryInit, 500);
            } else {
              const mapContainer = document.getElementById('deliveryMap');
              if (mapContainer) {
                mapContainer.innerHTML = `
                  <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 20px; text-align: center; color: #ecf0f1;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #e74c3c; margin-bottom: 15px;"></i>
                    <h3 style="margin: 0 0 10px 0; color: #ecf0f1;">Error al cargar el mapa</h3>
                    <p style="margin: 0 0 15px 0; color: #bdc3c7; font-size: 0.9rem;">No se pudo cargar Leaflet. Intenta recargar la página.</p>
                    <button onclick="location.reload()" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.9rem;">
                      Recargar página
                    </button>
                  </div>
                `;
              }
            }
          };
          
          setTimeout(tryInit, 500);
          return;
        }

        const mapContainer = document.getElementById('deliveryMap');
        if (!mapContainer) {
          console.error('No se encontró el contenedor del mapa');
          return;
        }
        
        // Verificar si el contenedor ya tiene un mapa inicializado
        const L = (window as any).L;
        const mapContainerAny = mapContainer as any;
        if (L && mapContainerAny._leaflet_id) {
          // El contenedor ya tiene un mapa, destruirlo primero
          try {
            if (deliveryMap) {
              deliveryMap.remove();
            }
            // Limpiar el ID de Leaflet del contenedor
            delete mapContainerAny._leaflet_id;
          } catch (e) {
            console.warn('Error al destruir mapa existente:', e);
          }
        }
        
        // Asegurar que el contenedor tenga altura
        if (mapContainer instanceof HTMLElement) {
          mapContainer.style.height = '400px';
          mapContainer.style.minHeight = '400px';
          mapContainer.style.width = '100%';
        }
        
        // Limpiar cualquier contenido previo
        mapContainer.innerHTML = '';
        
        if (!L) {
          console.error('Leaflet no está disponible');
          mapContainer.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 20px; text-align: center; color: #ecf0f1;">
              <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #e74c3c; margin-bottom: 15px;"></i>
              <h3 style="margin: 0 0 10px 0; color: #ecf0f1;">Error al cargar Leaflet</h3>
              <p style="margin: 0; color: #bdc3c7; font-size: 0.9rem;">Por favor recarga la página</p>
            </div>
          `;
          return;
        }
        
        try {
          // Inicializar mapa con OpenStreetMap
          deliveryMap = L.map(mapContainer, {
            zoomControl: true,
            scrollWheelZoom: true
          }).setView([19.4326, -99.1332], 13);
          
          // Forzar actualización del tamaño del mapa después de un pequeño delay
          setTimeout(() => {
            if (deliveryMap) {
              deliveryMap.invalidateSize();
            }
          }, 100);
          
          // Agregar capa de OpenStreetMap
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
          }).addTo(deliveryMap);

          // Crear marcador
          deliveryMarker = L.marker([19.4326, -99.1332], {
            draggable: true,
            title: 'Arrastra para seleccionar tu dirección'
          }).addTo(deliveryMap);

          // Cuando se mueve el marcador
          deliveryMarker.on('dragend', () => {
            const position = deliveryMarker.getLatLng();
            reverseGeocode(position.lat, position.lng, (data: any) => {
              fillAddressFromNominatim(data);
              updateDeliveryInfo();
            });
          });

          // Cuando se hace clic en el mapa
          deliveryMap.on('click', (e: any) => {
            deliveryMarker.setLatLng(e.latlng);
            reverseGeocode(e.latlng.lat, e.latlng.lng, (data: any) => {
              fillAddressFromNominatim(data);
              updateDeliveryInfo();
            });
          });

          // Autocompletado de búsqueda
          const addressSearchInput = document.getElementById('addressSearch') as HTMLInputElement;
          const searchResults = document.createElement('div');
          searchResults.id = 'addressSearchResults';
          searchResults.style.cssText = 'position: absolute; top: 100%; left: 0; right: 0; background: rgba(30, 30, 30, 0.98); border: 1px solid rgba(102, 126, 234, 0.3); border-radius: 8px; max-height: 300px; overflow-y: auto; z-index: 1000; margin-top: 5px; display: none;';
          
          if (addressSearchInput && addressSearchInput.parentElement) {
            addressSearchInput.parentElement.style.position = 'relative';
            addressSearchInput.parentElement.appendChild(searchResults);
            
            addressSearchInput.addEventListener('input', () => {
              const query = addressSearchInput.value;
              if (query.length >= 3) {
                searchAddresses(query, (results: any[]) => {
                  if (results.length > 0) {
                    searchResults.innerHTML = results.map((result: any) => `
                      <div class="search-result-item" style="padding: 12px 15px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.1); transition: background 0.2s;"
                           data-lat="${result.lat}" data-lon="${result.lon}" data-display-name="${result.display_name}">
                        <strong style="color: #fdbb2d; display: block; margin-bottom: 4px;">${result.display_name.split(',')[0]}</strong>
                        <span style="color: #bdc3c7; font-size: 0.85rem;">${result.display_name}</span>
                      </div>
                    `).join('');
                    searchResults.style.display = 'block';
                    
                    // Agregar event listeners a los resultados
                    searchResults.querySelectorAll('.search-result-item').forEach((item: any) => {
                      item.addEventListener('click', () => {
                        const lat = parseFloat(item.dataset.lat);
                        const lon = parseFloat(item.dataset.lon);
                        const displayName = item.dataset.displayName;
                        
                        addressSearchInput.value = displayName;
                        searchResults.style.display = 'none';
                        
                        deliveryMap.setView([lat, lon], 17);
                        deliveryMarker.setLatLng([lat, lon]);
                        
                        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1&accept-language=es`)
                          .then(response => response.json())
                          .then((data: any) => {
                            if (data && data.address) {
                              fillAddressFromNominatim(data);
                              updateDeliveryInfo();
                            }
                          });
                      });
                      
                      item.addEventListener('mouseenter', () => {
                        item.style.background = 'rgba(102, 126, 234, 0.2)';
                      });
                      item.addEventListener('mouseleave', () => {
                        item.style.background = 'transparent';
                      });
                    });
                  } else {
                    searchResults.style.display = 'none';
                  }
                });
              } else {
                searchResults.style.display = 'none';
              }
            });
          }

          // Cerrar resultados al hacer clic fuera
          document.addEventListener('click', (e: any) => {
            if (searchResults && !searchResults.contains(e.target) && e.target !== addressSearchInput) {
              searchResults.style.display = 'none';
            }
          });

          // Botón de ubicación actual
          const useCurrentLocationBtn = document.getElementById('useCurrentLocation');
          if (useCurrentLocationBtn) {
            useCurrentLocationBtn.addEventListener('click', () => {
              if (navigator.geolocation) {
                useCurrentLocationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                useCurrentLocationBtn.setAttribute('disabled', 'true');
                
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    const pos = [position.coords.latitude, position.coords.longitude];
                    
                    deliveryMap.setView(pos, 17);
                    deliveryMarker.setLatLng(pos);
                    
                    reverseGeocode(pos[0], pos[1], (data: any) => {
                      fillAddressFromNominatim(data);
                      updateDeliveryInfo();
                      useCurrentLocationBtn.innerHTML = '<i class="fas fa-crosshairs"></i>';
                      useCurrentLocationBtn.removeAttribute('disabled');
                    });
                  },
                  (error) => {
                    showMessage('No se pudo obtener tu ubicación. Por favor, selecciona una dirección manualmente.', 'error');
                    useCurrentLocationBtn.innerHTML = '<i class="fas fa-crosshairs"></i>';
                    useCurrentLocationBtn.removeAttribute('disabled');
                  }
                );
              } else {
                showMessage('Tu navegador no soporta geolocalización.', 'error');
              }
            });
          }
        } catch (error: any) {
          console.error('Error al inicializar el mapa:', error);
          const mapContainer = document.getElementById('deliveryMap');
          if (mapContainer) {
            mapContainer.innerHTML = `
              <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 20px; text-align: center; color: #ecf0f1;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #e74c3c; margin-bottom: 15px;"></i>
                <h3 style="margin: 0 0 10px 0; color: #ecf0f1;">Error al inicializar el mapa</h3>
                <p style="margin: 0 0 15px 0; color: #bdc3c7; font-size: 0.9rem;">${error.message || 'Error desconocido'}</p>
                <button onclick="location.reload()" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.9rem;">
                  Recargar página
                </button>
              </div>
            `;
          }
        }
      }

      function fillAddressFromNominatim(data: any) {
        const addr = data.address || {};
        
        const streetInput = document.getElementById('deliveryStreet') as HTMLInputElement;
        const colonyInput = document.getElementById('deliveryColony') as HTMLInputElement;
        const cityInput = document.getElementById('deliveryCity') as HTMLInputElement;
        const stateInput = document.getElementById('deliveryState') as HTMLInputElement;
        const postalCodeInput = document.getElementById('deliveryPostalCode') as HTMLInputElement;
        const addressSearchInput = document.getElementById('addressSearch') as HTMLInputElement;

        const street = addr.road || addr.street || '';
        const streetNumber = addr.house_number || '';
        const colony = addr.suburb || addr.neighbourhood || addr.city_district || '';
        const city = addr.city || addr.town || addr.village || addr.municipality || '';
        const state = addr.state || '';
        const postalCode = addr.postcode || '';

        if (streetInput) {
          streetInput.value = streetNumber ? `${street} #${streetNumber}` : street;
        }
        if (colonyInput) {
          colonyInput.value = colony;
        }
        if (cityInput) {
          cityInput.value = city;
        }
        if (stateInput) {
          stateInput.value = state;
        }
        if (postalCodeInput) {
          postalCodeInput.value = postalCode;
        }
        if (addressSearchInput) {
          addressSearchInput.value = data.display_name || '';
        }
      }

      function fillAddressFromPlace(place: any) {
        let street = '';
        let streetNumber = '';
        let colony = '';
        let city = '';
        let state = '';
        let postalCode = '';

        // Procesar componentes de la dirección
        if (place.address_components) {
          for (const component of place.address_components) {
            const type = component.types[0];

            switch (type) {
              case 'street_number':
                streetNumber = component.long_name;
                break;
              case 'route':
                street = component.long_name;
                break;
              case 'sublocality_level_1':
              case 'neighborhood':
                if (!colony) colony = component.long_name;
                break;
              case 'locality':
                city = component.long_name;
                break;
              case 'administrative_area_level_1':
                state = component.short_name;
                break;
              case 'postal_code':
                postalCode = component.long_name;
                break;
            }
          }
        }

        // Llenar campos del formulario
        const streetInput = document.getElementById('deliveryStreet') as HTMLInputElement;
        const colonyInput = document.getElementById('deliveryColony') as HTMLInputElement;
        const cityInput = document.getElementById('deliveryCity') as HTMLInputElement;
        const stateInput = document.getElementById('deliveryState') as HTMLInputElement;
        const postalCodeInput = document.getElementById('deliveryPostalCode') as HTMLInputElement;
        const addressSearchInput = document.getElementById('addressSearch') as HTMLInputElement;

        if (streetInput) {
          streetInput.value = streetNumber ? `${street} #${streetNumber}` : street;
        }
        if (colonyInput) {
          colonyInput.value = colony;
        }
        if (cityInput) {
          cityInput.value = city;
        }
        if (stateInput) {
          stateInput.value = state;
        }
        if (postalCodeInput) {
          postalCodeInput.value = postalCode;
        }
        if (addressSearchInput) {
          addressSearchInput.value = place.formatted_address || '';
        }
      }

      function setupPaymentMethods() {
        // Llenar años de expiración de tarjeta
        const cardYearSelect = document.getElementById('cardYear') as HTMLSelectElement;
        if (cardYearSelect) {
          const currentYear = new Date().getFullYear();
          for (let i = 0; i < 15; i++) {
            const year = currentYear + i;
            const option = document.createElement('option');
            option.value = year.toString();
            option.textContent = year.toString();
            cardYearSelect.appendChild(option);
          }
        }

        // Formatear número de tarjeta (agregar espacios cada 4 dígitos)
        const cardNumberInput = document.getElementById('cardNumber') as HTMLInputElement;
        if (cardNumberInput) {
          cardNumberInput.addEventListener('input', (e) => {
            let value = (e.target as HTMLInputElement).value.replace(/\s/g, '');
            value = value.replace(/(.{4})/g, '$1 ').trim();
            (e.target as HTMLInputElement).value = value;
          });
        }

        // Manejar cambio de método de pago
        const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
        paymentMethods.forEach((method) => {
          method.addEventListener('change', (e) => {
            const selectedMethod = (e.target as HTMLInputElement).value;
            const cardForm = document.getElementById('cardPaymentForm');
            const transferInfo = document.getElementById('transferPaymentInfo');
            const paypalInfo = document.getElementById('paypalPaymentInfo');

            // Ocultar todos los formularios
            if (cardForm) cardForm.style.display = 'none';
            if (transferInfo) transferInfo.style.display = 'none';
            if (paypalInfo) paypalInfo.style.display = 'none';

            // Mostrar el formulario correspondiente
            if (selectedMethod === 'tarjeta' && cardForm) {
              cardForm.style.display = 'block';
            } else if (selectedMethod === 'transferencia' && transferInfo) {
              transferInfo.style.display = 'block';
            } else if (selectedMethod === 'paypal' && paypalInfo) {
              paypalInfo.style.display = 'block';
            }
          });
        });

        // Mostrar formulario de tarjeta por defecto si está seleccionado
        const defaultMethod = document.querySelector('input[name="paymentMethod"]:checked') as HTMLInputElement;
        if (defaultMethod && defaultMethod.value === 'tarjeta') {
          const cardForm = document.getElementById('cardPaymentForm');
          if (cardForm) cardForm.style.display = 'block';
        }
      }

      // Función para copiar al portapapeles
      (window as any).copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
          showMessage('¡Copiado al portapapeles!', 'success');
        }).catch(() => {
          // Fallback para navegadores antiguos
          const textArea = document.createElement('textarea');
          textArea.value = text;
          textArea.style.position = 'fixed';
          textArea.style.opacity = '0';
          document.body.appendChild(textArea);
          textArea.select();
          try {
            document.execCommand('copy');
            showMessage('¡Copiado al portapapeles!', 'success');
          } catch (err) {
            showMessage('No se pudo copiar. Por favor, copia manualmente.', 'error');
          }
          document.body.removeChild(textArea);
        });
      };

      // Función para simular pago con PayPal
      function showPaypalPaymentModal() {
        const { total, pointsToEarn } = calculateCartTotals();
        
        // Crear modal de PayPal
        const modal = document.createElement('div');
        modal.id = 'paypalModal';
        modal.className = 'paypal-modal-overlay';
        modal.innerHTML = `
          <div class="paypal-modal-content">
            <div class="paypal-modal-header">
              <div class="paypal-logo">
                <i class="fab fa-paypal"></i>
                <span>PayPal</span>
              </div>
              <button class="paypal-modal-close" onclick="closePaypalModal()">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="paypal-modal-body">
              <div class="paypal-amount">
                <p class="paypal-amount-label">Total a pagar</p>
                <p class="paypal-amount-value">$${total.toFixed(2)}</p>
              </div>
              <div class="paypal-login-section">
                <h3>Iniciar sesión en PayPal</h3>
                <p class="paypal-test-note">💡 Modo de Prueba: Usa cualquier email y contraseña</p>
                <div class="paypal-form">
                  <div class="form-group">
                    <label class="form-label">Email de PayPal</label>
                    <input type="email" id="paypalEmail" class="form-input" placeholder="tu-email@ejemplo.com" value="buyer@paypalsandbox.com">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Contraseña</label>
                    <input type="password" id="paypalPassword" class="form-input" placeholder="Tu contraseña" value="test123">
                  </div>
                  <button class="paypal-login-btn" onclick="processPaypalPayment()">
                    <i class="fab fa-paypal"></i>
                    Iniciar sesión y pagar
                  </button>
                </div>
                <div class="paypal-alternative">
                  <p>O</p>
                  <button class="paypal-guest-btn" onclick="processPaypalPayment()">
                    <i class="fas fa-credit-card"></i>
                    Pagar como invitado (Modo Prueba)
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;
        
        document.body.appendChild(modal);
        
        // Cerrar modal al hacer clic fuera
        modal.addEventListener('click', (e) => {
          if ((e.target as HTMLElement).id === 'paypalModal') {
            (window as any).closePaypalModal();
          }
        });
      }

      // Función para cerrar modal de PayPal
      (window as any).closePaypalModal = () => {
        const modal = document.getElementById('paypalModal');
        if (modal) {
          modal.remove();
        }
      };

      // Hacer la función accesible globalmente
      (window as any).showPaypalPaymentModal = showPaypalPaymentModal;
      
      // Agregar event listener al botón "Continuar con PayPal"
      setTimeout(() => {
        const paypalContinueBtn = document.getElementById('paypalContinueBtn');
        if (paypalContinueBtn) {
          paypalContinueBtn.addEventListener('click', () => {
            if (typeof (window as any).showPaypalPaymentModal === 'function') {
              (window as any).showPaypalPaymentModal();
            } else {
              console.error('showPaypalPaymentModal no está disponible');
              showMessage('Error al abrir el modal de PayPal. Por favor, intenta de nuevo.', 'error');
            }
          });
        }
      }, 500);

      // Función para procesar pago de PayPal
      (window as any).processPaypalPayment = () => {
        const modal = document.getElementById('paypalModal');
        const paypalEmail = (document.getElementById('paypalEmail') as HTMLInputElement)?.value || '';
        const paypalPassword = (document.getElementById('paypalPassword') as HTMLInputElement)?.value || '';
        
        if (!paypalEmail) {
          showMessage('Por favor ingresa tu email de PayPal', 'error');
          return;
        }

        // Simular proceso de autenticación
        const loginBtn = document.querySelector('.paypal-login-btn') as HTMLButtonElement;
        if (loginBtn) {
          loginBtn.innerHTML = '<span class="loading-spinner"></span> Procesando...';
          loginBtn.disabled = true;
        }

        // Simular delay de PayPal
        setTimeout(() => {
          // Cerrar modal
          if (modal) modal.remove();

          // Continuar con el proceso de checkout normal
          const { total, pointsToEarn } = calculateCartTotals();
          const paymentMethod = 'paypal';

          // Estado del botón de checkout
          const checkoutBtn = document.getElementById('checkoutBtn') as HTMLButtonElement | null;
          const originalText = checkoutBtn ? checkoutBtn.innerHTML : '';
          if (checkoutBtn) {
            checkoutBtn.innerHTML = '<span class="loading-spinner"></span> Procesando...';
            checkoutBtn.disabled = true;
          }

          // Crear pedido en backend
          const orderData = {
            usuario_id: self.currentUser!.id,
            total,
            puntos_usados: pointsUsed,
            puntos_ganados: pointsToEarn,
            metodo_pago: paymentMethod,
            items: cart.map((item: any) => ({
              cerveza_id: item.id,
              cantidad: item.quantity,
              precio_unitario: item.price,
              subtotal: item.price * item.quantity
            }))
          };

          self.databaseService.createPedido(orderData as any).subscribe({
            next: (response: any) => {
              // Actualizar puntos del usuario
              self.databaseService.getPuntosUsuario(self.currentUser!.id!).subscribe({
                next: (puntos: any) => {
                  const el = document.getElementById('pointsBalance');
                  if (el) el.textContent = Number(puntos).toLocaleString();
                },
                error: (err: any) => {
                  console.log('Error al cargar puntos:', err);
                }
              });

              // Limpiar carrito
              cart = [];
              appliedDiscount = 0;
              pointsUsed = 0;
              updateCartBadges();

              showView(views.orders);
              generateOrdersList();
              showMessage(`¡Pedido #${response.id} realizado con éxito con PayPal! Ganaste ${pointsToEarn} CervezaPoints`, 'success');
            },
            error: (err: any) => {
              const msg = err?.error?.error || 'Error al procesar el pedido';
              showMessage(msg, 'error');
            },
            complete: () => {
              if (checkoutBtn) {
                checkoutBtn.innerHTML = originalText;
                checkoutBtn.disabled = false;
              }
            }
          });
        }, 2000); // Simular 2 segundos de procesamiento
      };

      function setupDeliveryOptions() {
        const pickupOption = document.getElementById('pickupOption') as HTMLInputElement;
        const deliveryOption = document.getElementById('deliveryOption') as HTMLInputElement;
        const deliveryAddressSection = document.getElementById('deliveryAddressSection');
        const shippingCostEl = document.getElementById('shippingCost');
        const postalCodeInput = document.getElementById('deliveryPostalCode') as HTMLInputElement;
        
        if (pickupOption) {
          pickupOption.addEventListener('change', () => {
            if (pickupOption.checked) {
              deliveryMethod = 'pickup';
              if (deliveryAddressSection) deliveryAddressSection.style.display = 'none';
              const pickupStoresSection = document.getElementById('pickupStoresSection');
              if (pickupStoresSection) pickupStoresSection.style.display = 'block';
              if (shippingCostEl) shippingCostEl.textContent = 'Gratis';
              deliveryAddress = null;
              shippingCost = 0;
              updateCartSummary();
              loadTiendasDisponibles();
            }
          });
          
          // Cargar tiendas al inicio si pickup está seleccionado
          if (pickupOption.checked) {
            loadTiendasDisponibles();
          }
        }
        
        if (deliveryOption) {
          deliveryOption.addEventListener('change', () => {
            if (deliveryOption.checked) {
              deliveryMethod = 'delivery';
              const pickupStoresSection = document.getElementById('pickupStoresSection');
              if (pickupStoresSection) pickupStoresSection.style.display = 'none';
              selectedTiendaId = null;
              if (deliveryAddressSection) deliveryAddressSection.style.display = 'block';
              
              // Inicializar mapa cuando se muestra la sección
              // Esperar a que el DOM esté listo y Leaflet esté cargado
              const checkAndInitMap = () => {
                // Solo inicializar si el mapa no existe
                if (typeof (window as any).L !== 'undefined' && !deliveryMap) {
                  // Esperar un poco más para asegurar que el DOM esté completamente renderizado
                  setTimeout(() => {
                    initLeafletMap();
                    // Forzar actualización del tamaño después de inicializar
                    setTimeout(() => {
                      if (deliveryMap) {
                        deliveryMap.invalidateSize();
                      }
                    }, 200);
                  }, 150);
                } else if (typeof (window as any).L === 'undefined') {
                  // Si Leaflet aún no está cargado, esperar un poco más
                  setTimeout(checkAndInitMap, 200);
                } else if (deliveryMap) {
                  // Si el mapa ya existe, solo actualizar su tamaño
                  setTimeout(() => {
                    if (deliveryMap) {
                      deliveryMap.invalidateSize();
                    }
                  }, 100);
                }
              };
              
              setTimeout(checkAndInitMap, 100);
              
              updateDeliveryInfo();
            }
          });
        }
        
        // Función global para cuando Leaflet esté listo
        (window as any).onLeafletReady = () => {
          // Si la sección de entrega ya está visible, inicializar el mapa solo si no existe
          const deliveryAddressSection = document.getElementById('deliveryAddressSection');
          if (deliveryAddressSection && deliveryAddressSection.style.display !== 'none' && !deliveryMap) {
            setTimeout(() => {
              initLeafletMap();
              // Actualizar tamaño después de inicializar
              setTimeout(() => {
                if (deliveryMap) {
                  deliveryMap.invalidateSize();
                }
              }, 200);
            }, 100);
          } else if (deliveryMap) {
            // Si el mapa ya existe, solo actualizar su tamaño
            setTimeout(() => {
              if (deliveryMap) {
                deliveryMap.invalidateSize();
              }
            }, 100);
          }
        };
        
        // Detectar cambios en el código postal para calcular costo
        if (postalCodeInput) {
          postalCodeInput.addEventListener('input', () => {
            updateDeliveryInfo();
          });
        }
        
        // Cargar direcciones guardadas del usuario
        loadSavedAddresses();
        
        // Manejar selección de dirección guardada
        const savedAddressSelect = document.getElementById('savedAddressSelect') as HTMLSelectElement;
        if (savedAddressSelect) {
          savedAddressSelect.addEventListener('change', (e) => {
            const selectedValue = (e.target as HTMLSelectElement).value;
            if (selectedValue) {
              fillAddressForm(JSON.parse(selectedValue));
            }
          });
        }
      }

      function updateDeliveryInfo() {
        const postalCode = (document.getElementById('deliveryPostalCode') as HTMLInputElement)?.value;
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        if (postalCode && postalCode.length === 5) {
          deliveryAddress = {
            postalCode: postalCode,
            street: (document.getElementById('deliveryStreet') as HTMLInputElement)?.value,
            colony: (document.getElementById('deliveryColony') as HTMLInputElement)?.value,
            city: (document.getElementById('deliveryCity') as HTMLInputElement)?.value,
            state: (document.getElementById('deliveryState') as HTMLInputElement)?.value,
            references: (document.getElementById('deliveryReferences') as HTMLTextAreaElement)?.value,
            phone: (document.getElementById('deliveryPhone') as HTMLInputElement)?.value
          };
          
          shippingCost = calculateShippingCost(subtotal, deliveryAddress);
          
          const shippingCostEl = document.getElementById('shippingCost');
          if (shippingCostEl) {
            if (shippingCost === 0) {
              if (subtotal >= 500) {
                shippingCostEl.textContent = 'Gratis';
                shippingCostEl.style.color = '#27ae60';
              } else {
                shippingCostEl.textContent = 'Pedido mínimo: $100';
                shippingCostEl.style.color = '#e74c3c';
              }
            } else {
              shippingCostEl.textContent = `$${shippingCost.toFixed(2)}`;
              shippingCostEl.style.color = '#fdbb2d';
            }
          }
          
          // Mostrar información de la zona
          updateZoneInfo(postalCode);
          updateCartSummary();
        }
      }

      // Función para cargar tiendas disponibles
      function loadTiendasDisponibles() {
        const storesList = document.getElementById('storesList');
        if (!storesList) return;
        
        // Obtener IDs de cervezas en el carrito
        const cervezaIds = cart.map(item => item.id);
        
        if (cervezaIds.length === 0) {
          // Si no hay productos, mostrar todas las tiendas
          self.databaseService.getTiendas().subscribe({
            next: (tiendas: any[]) => {
              renderTiendas(tiendas, []);
            },
            error: (err: any) => {
              console.error('Error al cargar tiendas:', err);
              storesList.innerHTML = `
                <div class="error-message">
                  <i class="fas fa-exclamation-circle"></i>
                  <p>Error al cargar tiendas. Por favor intenta de nuevo.</p>
                </div>
              `;
            }
          });
        } else {
          // Obtener tiendas con disponibilidad de los productos
          self.databaseService.getTiendasDisponibles(cervezaIds).subscribe({
            next: (tiendas: any[]) => {
              renderTiendas(tiendas, cervezaIds);
            },
            error: (err: any) => {
              console.error('Error al cargar tiendas disponibles:', err);
              // Si falla, intentar cargar todas las tiendas
              self.databaseService.getTiendas().subscribe({
                next: (tiendas: any[]) => {
                  renderTiendas(tiendas, cervezaIds);
                },
                error: () => {
                  storesList.innerHTML = `
                    <div class="error-message">
                      <i class="fas fa-exclamation-circle"></i>
                      <p>Error al cargar tiendas. Por favor intenta de nuevo.</p>
                    </div>
                  `;
                }
              });
            }
          });
        }
      }
      
      function renderTiendas(tiendas: any[], cervezaIds: number[]) {
        const storesList = document.getElementById('storesList');
        if (!storesList) return;
        
        // Guardar tiendas en caché
        tiendasCache = tiendas;
        
        if (tiendas.length === 0) {
          storesList.innerHTML = `
            <div class="no-stores-message">
              <i class="fas fa-store-slash"></i>
              <p>No hay tiendas disponibles en este momento.</p>
            </div>
          `;
          return;
        }
        
        storesList.innerHTML = tiendas.map((tienda: any) => {
          const horario = `${tienda.horario_apertura || '09:00'} - ${tienda.horario_cierre || '21:00'}`;
          const isSelected = selectedTiendaId === tienda.id;
          
          // Calcular disponibilidad de productos
          let disponibilidadHtml = '';
          if (tienda.inventario && tienda.inventario.length > 0) {
            const productosDisponibles = tienda.inventario.length;
            const productosSolicitados = cervezaIds.length;
            const porcentaje = Math.round((productosDisponibles / productosSolicitados) * 100);
            
            disponibilidadHtml = `
              <div class="store-availability">
                <i class="fas fa-check-circle" style="color: #00b894;"></i>
                <span>${productosDisponibles} de ${productosSolicitados} productos disponibles (${porcentaje}%)</span>
              </div>
              <div class="store-products-list">
                ${tienda.inventario.map((item: any) => `
                  <div class="store-product-item">
                    <span class="product-name">${item.cerveza_nombre}</span>
                    <span class="product-stock ${item.stock_disponible > 0 ? 'in-stock' : 'out-of-stock'}">
                      ${item.stock_disponible > 0 ? `${item.stock_disponible} disponibles` : 'Agotado'}
                    </span>
                  </div>
                `).join('')}
              </div>
            `;
          } else if (cervezaIds.length > 0) {
            disponibilidadHtml = `
              <div class="store-availability">
                <i class="fas fa-info-circle" style="color: #fdcb6e;"></i>
                <span>Verificando disponibilidad...</span>
              </div>
            `;
          }
          
          return `
            <div class="store-card ${isSelected ? 'selected' : ''}" data-tienda-id="${tienda.id}">
              <div class="store-card-header">
                <div class="store-info">
                  <h4 class="store-name">
                    <i class="fas fa-store"></i>
                    ${tienda.nombre}
                  </h4>
                  <div class="store-address">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${tienda.direccion}, ${tienda.ciudad}, ${tienda.estado}</span>
                  </div>
                  <div class="store-details">
                    <div class="store-detail-item">
                      <i class="fas fa-clock"></i>
                      <span>${horario}</span>
                    </div>
                    <div class="store-detail-item">
                      <i class="fas fa-calendar"></i>
                      <span>${tienda.dias_abierto || 'Lunes-Domingo'}</span>
                    </div>
                    ${tienda.telefono ? `
                      <div class="store-detail-item">
                        <i class="fas fa-phone"></i>
                        <span>${tienda.telefono}</span>
                      </div>
                    ` : ''}
                  </div>
                </div>
                <div class="store-select">
                  <button class="btn-select-store ${isSelected ? 'selected' : ''}" onclick="selectTienda(${tienda.id})">
                    ${isSelected ? '<i class="fas fa-check-circle"></i> Seleccionada' : 'Seleccionar'}
                  </button>
                </div>
              </div>
              ${disponibilidadHtml}
            </div>
          `;
        }).join('');
      }
      
      // Función global para seleccionar tienda
      (window as any).selectTienda = (tiendaId: number) => {
        selectedTiendaId = tiendaId;
        // Re-renderizar con los datos en caché
        renderTiendas(tiendasCache, cart.map(item => item.id));
        updateCartSummary();
      };

      function updateZoneInfo(postalCode: string) {
        const zoneInfo = document.getElementById('deliveryZoneInfo');
        const zoneName = document.getElementById('zoneName');
        const zoneMessage = document.getElementById('zoneMessage');
        
        if (!zoneInfo || !zoneName || !zoneMessage) return;
        
        const pc = parseInt(postalCode);
        let zone = '';
        let message = '';
        
        if (pc >= 1000 && pc < 2000) {
          zone = 'Centro';
          message = 'Sin cargo adicional. Entrega en 30-45 minutos.';
        } else if (pc >= 2000 && pc < 3000) {
          zone = 'Norte';
          message = 'Cargo adicional de $30. Entrega en 45-60 minutos.';
        } else if (pc >= 3000 && pc < 4000) {
          zone = 'Sur';
          message = 'Cargo adicional de $20. Entrega en 40-55 minutos.';
        } else {
          zone = 'Zona Extendida';
          message = 'Cargo adicional de $40. Entrega en 60-90 minutos.';
        }
        
        zoneName.textContent = zone;
        zoneMessage.textContent = message;
        zoneInfo.style.display = 'block';
      }

      function loadSavedAddresses() {
        if (!self.currentUser?.id) return;
        
        // Aquí se cargarían las direcciones guardadas de la BD
        // Por ahora dejamos el selector con solo "Nueva dirección..."
        console.log('Cargando direcciones guardadas del usuario...');
      }

      function fillAddressForm(address: any) {
        (document.getElementById('deliveryStreet') as HTMLInputElement).value = address.street || '';
        (document.getElementById('deliveryColony') as HTMLInputElement).value = address.colony || '';
        (document.getElementById('deliveryPostalCode') as HTMLInputElement).value = address.postalCode || '';
        (document.getElementById('deliveryCity') as HTMLInputElement).value = address.city || '';
        (document.getElementById('deliveryState') as HTMLInputElement).value = address.state || '';
        (document.getElementById('deliveryReferences') as HTMLTextAreaElement).value = address.references || '';
        (document.getElementById('deliveryPhone') as HTMLInputElement).value = address.phone || '';
        
        updateDeliveryInfo();
      }
      
      // Variable para evitar llamadas duplicadas al carrito
      let cartLoading = false;
      let lastCartCall = 0;
      const CART_CALL_THROTTLE = 300; // ms

      function renderCart() {
        if (!self.currentUser) return;
        
        // Evitar llamadas duplicadas muy cercanas en el tiempo
        const now = Date.now();
        if (cartLoading || (now - lastCartCall < CART_CALL_THROTTLE)) {
          return;
        }
        
        cartLoading = true;
        lastCartCall = now;
        
        // Cargar carrito desde backend
        self.databaseService.getCarrito(self.currentUser.id!).subscribe({
          next: (cartItems: any[]) => {
            cart = cartItems.map((item: any) => ({
              id: item.cerveza_id,
              name: item.cerveza?.nombre || 'Cerveza',
              style: item.cerveza?.estilo || '',
              description: item.cerveza?.descripcion || '',
              price: Number(item.precio_unitario),
              points: item.cerveza?.puntos_ganados || 0,
              image: normalizeImageUrl(item.cerveza?.imagen_url, item.cerveza?.nombre || 'Cerveza'),
              quantity: item.cantidad,
              cartItemId: item.id // Guardar el ID del item del carrito para eliminar
            }));
            
            const emptyCart = document.getElementById('emptyCart');
            const summarySection = document.getElementById('cartSummarySection');
            
            if (cart.length === 0) {
              containers.cartItems!.innerHTML = '';
              (emptyCart as HTMLElement).style.display = 'block';
              (summarySection as HTMLElement).style.display = 'none';
              return;
            }
            
            (emptyCart as HTMLElement).style.display = 'none';
            (summarySection as HTMLElement).style.display = 'block';
            
            containers.cartItems!.innerHTML = cart.map(item => `
              <div class="cart-item">
                <img src="${normalizeImageUrl(item.image, item.name)}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-info">
                  <div class="cart-item-name">${item.name}</div>
                  <div class="cart-item-style">${item.style}</div>
                  <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                </div>
                <div class="cart-item-controls">
                  <div class="quantity-controls">
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                    <span class="quantity-display">${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                  </div>
                  <button class="remove-item" onclick="removeFromCart(${item.id})">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            `).join('');
            
            // Configurar opciones de entrega
            setupDeliveryOptions();
            setupPaymentMethods();
            
            updateCartSummary();
            updateCartBadges();
            cartLoading = false;
          },
          error: () => {
            showMessage('Error al cargar el carrito', 'error');
            cartLoading = false;
          }
        });
      }
      
      function updateCartSummary() {
        const { subtotal, shipping, pointsToEarn, total } = calculateCartTotals();
        
        const subtotalEl = document.getElementById('subtotal');
        const pointsToEarnEl = document.getElementById('pointsToEarn');
        const totalEl = document.getElementById('total');
        const availablePointsEl = document.getElementById('availablePoints');
        
        if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
        if (pointsToEarnEl) pointsToEarnEl.textContent = `+${pointsToEarn} pts`;
        if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
        if (availablePointsEl) availablePointsEl.textContent = userPoints.toString();
        (document.getElementById('pointsToUse') as HTMLInputElement).max = Math.min(userPoints, Math.floor(subtotal * 100)).toString(); // 1 punto = $0.01
      }
      
      function applyPointsDiscount() {
        const pointsInput = document.getElementById('pointsToUse') as HTMLInputElement;
        const pointsToUse = parseInt(pointsInput.value) || 0;
        
        if (pointsToUse > userPoints) {
          showMessage('No tienes suficientes puntos', 'error');
          return;
        }
        
        if (pointsToUse < 100) {
          showMessage('Mínimo 100 puntos para usar', 'error');
          return;
        }
        
        appliedDiscount = pointsToUse * 0.01; // 100 puntos = $1
        pointsUsed = pointsToUse;
        
        const pointsDiscountEl = document.getElementById('pointsDiscount');
        const discountAmountEl = document.getElementById('discountAmount');
        const discountRowEl = document.getElementById('discountRow');
        const discountTotalEl = document.getElementById('discountTotal');
        
        if (pointsDiscountEl) pointsDiscountEl.style.display = 'block';
        if (discountAmountEl) discountAmountEl.textContent = appliedDiscount.toFixed(2);
        if (discountRowEl) discountRowEl.style.display = 'flex';
        if (discountTotalEl) discountTotalEl.textContent = `-$${appliedDiscount.toFixed(2)}`;
        
        updateCartSummary();
        showMessage(`${pointsToUse} puntos aplicados como descuento`, 'success');
      }
      
      // Generar catálogo de cervezas (desde API)
      function generateBeerCatalog() {
        if (!containers.beerGrid) return;
        
        self.databaseService.getCervezas().subscribe({
          next: (cervezas: any[]) => {
            // Normalizar a la estructura esperada
            beerData = cervezas.map((c: any) => ({
              id: c.id,
              name: c.nombre,
              style: c.estilo,
              description: c.descripcion || '',
              price: Number(c.precio),
              points: c.puntos_ganados ?? Math.floor((Number(c.precio) || 0) * 1),
              image: normalizeImageUrl(c.imagen_url, c.nombre || 'Cerveza')
            }));
            filteredBeers = [...beerData];
            renderBeerCards(filteredBeers);
          },
          error: () => {
            containers.beerGrid!.innerHTML = '<p style="text-align:center; padding: 40px;">No se pudo cargar el catálogo.</p>';
          }
        });
      }
      
      // Guardar referencias para acceso desde métodos públicos
      self.generateBeerCatalogFn = generateBeerCatalog;
      self.renderCartFn = renderCart;
      self.generateOrdersListFn = generateOrdersList;
      self.showMessageFn = showMessage;
      
      // Función para renderizar las cervezas (usada también por generateBeerCatalog)
      function renderBeerCards(beersToRender: any[]) {
        const resultsInfo = document.getElementById('resultsInfo');
        const resultsCount = document.getElementById('resultsCount');
        
        if (resultsInfo && resultsCount) {
          resultsCount.textContent = beersToRender.length.toString();
          resultsInfo.style.display = beersToRender.length > 0 ? 'block' : 'none';
        }
        
        if (beersToRender.length === 0) {
          containers.beerGrid!.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 40px; color: #bdc3c7;">
              <i class="fas fa-search" style="font-size: 64px; margin-bottom: 20px; color: #fdbb2d; opacity: 0.5;"></i>
              <h3 style="font-size: 24px; margin-bottom: 12px;">No se encontraron cervezas</h3>
              <p style="font-size: 16px; opacity: 0.8;">Intenta con otros términos de búsqueda o filtros</p>
            </div>
          `;
          return;
        }
        
        containers.beerGrid!.innerHTML = beersToRender.map(beer => `
          <div class="beer-card">
            <button class="favorite-btn" onclick="toggleFavorite(${beer.id})" style="position: absolute; top: 15px; right: 15px; background: rgba(0,0,0,0.6); border: none; color: #fff; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; z-index: 10; transition: all 0.3s ease;">
              <i class="fas fa-heart"></i>
            </button>
            <div class="beer-image-container">
              <img src="${normalizeImageUrl(beer.image, beer.name)}" alt="${beer.name}" class="beer-image" loading="lazy" onerror="this.style.display='none'; this.parentElement.classList.add('image-error');">
            </div>
            <div class="beer-info">
              <h3 class="beer-name">${beer.name}</h3>
              <p class="beer-style">${beer.style}</p>
              <p class="beer-description">${beer.description}</p>
              <p class="beer-points">+${beer.points} CervezaPoints</p>
              <p class="beer-price">$${beer.price.toFixed(2)}</p>
              <button class="add-to-cart" onclick="addToCart(${beer.id})" data-beer-id="${beer.id}">
                <span class="shimmer"></span>
                <i class="fas fa-shopping-cart"></i>
                <span>Añadir al Carrito</span>
              </button>
            </div>
          </div>
        `).join('');
      }
      
      // Filtrar y ordenar cervezas
      function filterBeers() {
        const searchTerm = (document.getElementById('searchBeer') as HTMLInputElement).value.toLowerCase();
        const styleFilter = (document.getElementById('filterStyle') as HTMLSelectElement).value;
        const priceFilter = (document.getElementById('filterPrice') as HTMLSelectElement).value;
        const ratingFilter = (document.getElementById('filterRating') as HTMLSelectElement).value;
        const categoryFilter = (document.getElementById('filterCategory') as HTMLSelectElement).value;
        const sortBy = (document.getElementById('sortBy') as HTMLSelectElement).value;
        
        // Mostrar/ocultar botón de limpiar búsqueda
        const clearSearchBtn = document.getElementById('clearSearch');
        const searchInput = document.getElementById('searchBeer') as HTMLInputElement;
        if (clearSearchBtn && searchInput) {
          clearSearchBtn.style.display = searchInput.value ? 'flex' : 'none';
        }
        
        filteredBeers = beerData.filter((beer: any) => {
          const matchesSearch = beer.name.toLowerCase().includes(searchTerm) || 
                               beer.description.toLowerCase().includes(searchTerm) ||
                               beer.style.toLowerCase().includes(searchTerm);
          const matchesStyle = !styleFilter || beer.style === styleFilter;
          
          let matchesPrice = true;
          if (priceFilter) {
            const [min, max] = priceFilter.split('-').map(p => p.replace('+', ''));
            if (max) {
              matchesPrice = beer.price >= parseInt(min) && beer.price <= parseInt(max);
            } else {
              matchesPrice = beer.price >= parseInt(min);
            }
          }
          
          let matchesRating = true;
          if (ratingFilter) {
            const minRating = parseFloat(ratingFilter.replace('+', ''));
            const rating = (beer as any).rating || 4.0;
            matchesRating = rating >= minRating;
          }
          
          let matchesCategory = true;
          if (categoryFilter) {
            switch(categoryFilter) {
              case 'featured':
                matchesCategory = (beer as any).featured || false;
                break;
              case 'premium':
                matchesCategory = beer.price >= 100;
                break;
            }
          }
          
          return matchesSearch && matchesStyle && matchesPrice && matchesRating && matchesCategory;
        });
        
        // Ordenar resultados
        if (sortBy !== 'default') {
          filteredBeers.sort((a: any, b: any) => {
            switch(sortBy) {
              case 'price-asc':
                return a.price - b.price;
              case 'price-desc':
                return b.price - a.price;
              case 'rating-desc':
                const ratingA = (a as any).rating || 4.0;
                const ratingB = (b as any).rating || 4.0;
                return ratingB - ratingA;
              case 'name-asc':
                return a.name.localeCompare(b.name);
              case 'name-desc':
                return b.name.localeCompare(a.name);
              default:
                return 0;
            }
          });
        }
        
        renderBeerCards(filteredBeers);
      }
      
      // Limpiar búsqueda
      function clearSearch() {
        const searchInput = document.getElementById('searchBeer') as HTMLInputElement;
        if (searchInput) {
          searchInput.value = '';
          const clearSearchBtn = document.getElementById('clearSearch');
          if (clearSearchBtn) clearSearchBtn.style.display = 'none';
          filterBeers();
        }
      }
      
      // Limpiar todos los filtros
      function clearAllFilters() {
        (document.getElementById('searchBeer') as HTMLInputElement).value = '';
        (document.getElementById('filterStyle') as HTMLSelectElement).value = '';
        (document.getElementById('filterPrice') as HTMLSelectElement).value = '';
        (document.getElementById('filterRating') as HTMLSelectElement).value = '';
        (document.getElementById('filterCategory') as HTMLSelectElement).value = '';
        (document.getElementById('sortBy') as HTMLSelectElement).value = 'default';
        const clearSearchBtn = document.getElementById('clearSearch');
        if (clearSearchBtn) clearSearchBtn.style.display = 'none';
        filterBeers();
      }
      
      // Generar lista de pedidos
      // Función para mostrar tracking del repartidor (cliente)
      function showRepartidorTracking(pedidoId: number) {
        if (!self.currentUser) return;
        
        // Crear modal para mostrar el mapa
        const modal = document.createElement('div');
        modal.id = 'repartidorTrackingModal';
        modal.className = 'tracking-modal-overlay';
        modal.innerHTML = `
          <div class="tracking-modal-content">
            <div class="tracking-modal-header">
              <h2><i class="fas fa-truck"></i> Ruta del Repartidor</h2>
              <button class="tracking-modal-close" onclick="closeRepartidorTracking()">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="tracking-modal-body">
              <div id="repartidorInfo" class="repartidor-info-card" style="display: none;">
                <div class="repartidor-info-header">
                  <i class="fas fa-user"></i>
                  <div>
                    <h3 id="repartidorNombre"></h3>
                    <p id="repartidorTelefono"></p>
                    <p id="repartidorVehiculo"></p>
                  </div>
                </div>
              </div>
              <div id="repartidorTrackingMap" style="height: 500px; width: 100%; border-radius: 8px; margin-top: 20px;"></div>
              <div id="repartidorTrackingStatus" class="tracking-status">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Cargando ubicación del repartidor...</span>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
        
        // Cargar información del repartidor
        self.databaseService.getRepartidorPedido(pedidoId).subscribe({
          next: (repartidor: any) => {
            const infoCard = document.getElementById('repartidorInfo');
            const nombreEl = document.getElementById('repartidorNombre');
            const telefonoEl = document.getElementById('repartidorTelefono');
            const vehiculoEl = document.getElementById('repartidorVehiculo');
            const statusEl = document.getElementById('repartidorTrackingStatus');
            
            if (infoCard && nombreEl && telefonoEl && vehiculoEl && statusEl) {
              infoCard.style.display = 'block';
              nombreEl.textContent = repartidor.nombre_completo || 'Repartidor';
              telefonoEl.textContent = `Tel: ${repartidor.telefono || 'N/A'}`;
              vehiculoEl.textContent = `${repartidor.vehiculo || 'Moto'} - ${repartidor.placa || 'N/A'}`;
              
              // Inicializar mapa si hay ubicación
              if (repartidor.latitud && repartidor.longitud) {
                initRepartidorTrackingMap(repartidor.latitud, repartidor.longitud, repartidor.direccion || 'En ruta');
                statusEl.innerHTML = `
                  <i class="fas fa-check-circle" style="color: #00b894;"></i>
                  <span>Repartidor en ruta</span>
                `;
                
                // Actualizar ubicación cada 10 segundos
                const updateInterval = setInterval(() => {
                  self.databaseService.getRepartidorUbicacion(repartidor.id).subscribe({
                    next: (ubicacion: any) => {
                      if (ubicacion && ubicacion.latitud && ubicacion.longitud) {
                        updateRepartidorTrackingMap(ubicacion.latitud, ubicacion.longitud);
                      }
                    },
                    error: () => clearInterval(updateInterval)
                  });
                }, 10000);
                
                // Limpiar intervalo al cerrar modal
                (window as any).closeRepartidorTracking = () => {
                  clearInterval(updateInterval);
                  modal.remove();
                };
              } else {
                statusEl.innerHTML = `
                  <i class="fas fa-exclamation-triangle" style="color: #fdcb6e;"></i>
                  <span>Ubicación no disponible aún</span>
                `;
              }
            }
          },
          error: (err: any) => {
            const statusEl = document.getElementById('repartidorTrackingStatus');
            if (statusEl) {
              statusEl.innerHTML = `
                <i class="fas fa-times-circle" style="color: #e74c3c;"></i>
                <span>${err?.error?.error || 'Error al cargar información del repartidor'}</span>
              `;
            }
          }
        });
      }
      
      let repartidorTrackingMap: any = null;
      let repartidorMarker: any = null;
      
      function initRepartidorTrackingMap(lat: number, lon: number, direccion: string) {
        const mapContainer = document.getElementById('repartidorTrackingMap');
        if (!mapContainer || typeof (window as any).L === 'undefined') {
          console.error('Leaflet no está disponible');
          return;
        }
        
        const L = (window as any).L;
        repartidorTrackingMap = L.map(mapContainer).setView([lat, lon], 15);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(repartidorTrackingMap);
        
        repartidorMarker = L.marker([lat, lon], {
          icon: L.divIcon({
            className: 'repartidor-marker',
            html: '<i class="fas fa-motorcycle" style="font-size: 24px; color: #fdbb2d;"></i>',
            iconSize: [30, 30],
            iconAnchor: [15, 30]
          })
        }).addTo(repartidorTrackingMap);
        
        if (direccion) {
          repartidorMarker.bindPopup(`<strong>Repartidor</strong><br>${direccion}`).openPopup();
        }
      }
      
      function updateRepartidorTrackingMap(lat: number, lon: number) {
        if (repartidorTrackingMap && repartidorMarker) {
          repartidorMarker.setLatLng([lat, lon]);
          repartidorTrackingMap.setView([lat, lon], 15);
        }
      }
      
      // Exponer función globalmente
      (window as any).showRepartidorTracking = showRepartidorTracking;
      (window as any).closeRepartidorTracking = () => {
        const modal = document.getElementById('repartidorTrackingModal');
        if (modal) modal.remove();
        if (repartidorTrackingMap) {
          repartidorTrackingMap.remove();
          repartidorTrackingMap = null;
        }
      };

      // Función para cargar rutas de repartidores (admin)
      function loadRepartidoresRutas() {
        const container = document.getElementById('repartidoresRutasContainer');
        if (!container) return;
        
        const horasSelect = document.getElementById('repartidoresHoras') as HTMLSelectElement;
        const horas = horasSelect ? parseInt(horasSelect.value) : 24;
        
        container.innerHTML = `
          <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Cargando rutas de repartidores...</p>
          </div>
        `;
        
        self.databaseService.getRutasRepartidores(horas).subscribe({
          next: (rutas: any[]) => {
            if (rutas.length === 0) {
              container.innerHTML = `
                <div class="empty-state">
                  <i class="fas fa-route" style="font-size: 64px; color: #bdc3c7; margin-bottom: 20px;"></i>
                  <h3>No hay rutas disponibles</h3>
                  <p>No se encontraron rutas de repartidores en el período seleccionado.</p>
                </div>
              `;
              return;
            }
            
            container.innerHTML = rutas.map((ruta: any) => {
              const repartidor = ruta.repartidor;
              const ubicaciones = ruta.ubicaciones || [];
              const vehiculoIcon = repartidor.vehiculo === 'Bicicleta' ? 'fa-bicycle' : 'fa-motorcycle';
              const pedidosActivos = repartidor.pedidos_activos || 0;
              
              return `
                <div class="repartidor-ruta-card" style="background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%); border-radius: 20px; padding: 32px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 0 2px rgba(253, 187, 45, 0.3); border: 2px solid rgba(253, 187, 45, 0.4); position: relative; overflow: hidden; margin-bottom: 0;">
                  <div style="position: absolute; top: 0; left: 0; right: 0; height: 5px; background: linear-gradient(90deg, #fdbb2d 0%, #f9a825 50%, #fdbb2d 100%); background-size: 200% 100%; animation: shimmer 3s linear infinite; z-index: 1;"></div>
                  <div class="repartidor-ruta-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 2px solid rgba(255, 255, 255, 0.1);">
                    <div class="repartidor-info" style="display: flex; gap: 18px; flex: 1;">
                      <div class="repartidor-avatar" style="width: 90px; height: 90px; border-radius: 50%; background: linear-gradient(135deg, #fdbb2d 0%, #f9a825 50%, #fdbb2d 100%); background-size: 200% 200%; display: flex; align-items: center; justify-content: center; color: #2c3e50; font-size: 2.2rem; flex-shrink: 0; box-shadow: 0 8px 25px rgba(253, 187, 45, 0.6), inset 0 2px 10px rgba(255, 255, 255, 0.4); position: relative; overflow: hidden; border: 3px solid rgba(255, 255, 255, 0.2);">
                        <i class="fas fa-user"></i>
                      </div>
                      <div class="repartidor-details" style="flex: 1;">
                        <h3 style="margin: 0 0 18px 0; color: #fff; font-size: 1.8rem; font-weight: 800; display: flex; align-items: center; gap: 15px; text-shadow: 0 3px 15px rgba(0, 0, 0, 0.5); letter-spacing: 1px;">
                          <span style="width: 6px; height: 35px; background: linear-gradient(135deg, #fdbb2d 0%, #f9a825 100%); border-radius: 4px; box-shadow: 0 0 15px rgba(253, 187, 45, 0.7); display: block;"></span>
                          ${repartidor.nombre_completo}
                        </h3>
                        <div class="repartidor-contact-info" style="margin: 12px 0;">
                          <div class="contact-item" style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: linear-gradient(90deg, rgba(253, 187, 45, 0.12) 0%, rgba(253, 187, 45, 0.05) 100%); border-radius: 10px; margin-bottom: 10px; border-left: 4px solid #fdbb2d; box-shadow: 0 2px 8px rgba(253, 187, 45, 0.1);">
                            <i class="fas fa-phone-alt" style="color: #fdbb2d; font-size: 1rem; width: 20px; text-align: center;"></i>
                            <span style="color: #ecf0f1; font-size: 0.95rem; font-weight: 500;">${repartidor.telefono}</span>
                          </div>
                        </div>
                        <div class="repartidor-badges" style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px;">
                          <span class="repartidor-vehiculo-badge" style="display: inline-flex; align-items: center; gap: 10px; padding: 10px 18px; background: linear-gradient(135deg, rgba(253, 187, 45, 0.25) 0%, rgba(249, 168, 37, 0.2) 100%); border-radius: 30px; font-size: 0.95rem; color: #fdbb2d; font-weight: 700; border: 2px solid rgba(253, 187, 45, 0.4); box-shadow: 0 4px 12px rgba(253, 187, 45, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2); text-transform: uppercase; letter-spacing: 0.5px;">
                            <i class="fas ${vehiculoIcon}" style="font-size: 1.1rem;"></i>
                            <span>${repartidor.vehiculo}</span>
                            <span class="placa-badge" style="background: rgba(253, 187, 45, 0.3); padding: 2px 8px; border-radius: 12px; font-size: 0.85rem; font-weight: 700; letter-spacing: 0.5px;">${repartidor.placa}</span>
                          </span>
                          ${pedidosActivos > 0 ? `
                            <span class="repartidor-pedidos-badge" style="display: inline-flex; align-items: center; gap: 10px; padding: 10px 18px; background: linear-gradient(135deg, rgba(0, 184, 148, 0.25) 0%, rgba(0, 160, 133, 0.2) 100%); border-radius: 30px; font-size: 0.95rem; color: #00b894; font-weight: 700; border: 2px solid rgba(0, 184, 148, 0.4); box-shadow: 0 4px 12px rgba(0, 184, 148, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2); letter-spacing: 0.5px;">
                              <i class="fas fa-shopping-cart" style="font-size: 1rem;"></i>
                              <span>${pedidosActivos} ${pedidosActivos === 1 ? 'pedido' : 'pedidos'}</span>
                            </span>
                          ` : `
                            <span class="repartidor-pedidos-badge inactive" style="display: inline-flex; align-items: center; gap: 10px; padding: 10px 18px; background: rgba(149, 165, 166, 0.15); border-radius: 30px; font-size: 0.95rem; color: #95a5a6; font-weight: 700; border: 2px solid rgba(149, 165, 166, 0.2); letter-spacing: 0.5px;">
                              <i class="fas fa-shopping-cart" style="font-size: 1rem;"></i>
                              <span>Sin pedidos</span>
                            </span>
                          `}
                        </div>
                      </div>
                    </div>
                    <div class="repartidor-stats" style="display: flex; flex-direction: column; gap: 15px; align-items: flex-end; min-width: 120px;">
                      <div class="stat-item" style="text-align: center; padding: 16px 22px; background: linear-gradient(135deg, rgba(253, 187, 45, 0.15) 0%, rgba(249, 168, 37, 0.1) 100%); border-radius: 12px; border: 2px solid rgba(253, 187, 45, 0.3); min-width: 110px; box-shadow: 0 4px 15px rgba(253, 187, 45, 0.2);">
                        <span class="stat-label" style="display: block; font-size: 0.75rem; color: #bdc3c7; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Ubicaciones</span>
                        <span class="stat-value" style="display: block; font-size: 1.8rem; font-weight: 700; color: #fdbb2d; text-shadow: 0 2px 10px rgba(253, 187, 45, 0.3);">${ubicaciones.length}</span>
                      </div>
                    </div>
                  </div>
                  ${ubicaciones.length > 0 ? `
                    <div class="repartidor-ruta-map" id="repartidorMap_${repartidor.id}" style="height: 300px; width: 100%; border-radius: 12px; margin-top: 15px; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3); border: 2px solid rgba(253, 187, 45, 0.3);"></div>
                  ` : `
                    <div class="no-ubicaciones" style="text-align: center; padding: 60px 30px; color: #bdc3c7; background: linear-gradient(135deg, rgba(0, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0.25) 100%); border-radius: 16px; border: 2px dashed rgba(253, 187, 45, 0.2); margin-top: 20px; position: relative; overflow: hidden;">
                      <div class="no-ubicaciones-icon" style="position: relative; z-index: 1; margin-bottom: 20px;">
                        <i class="fas fa-map-marker-alt" style="font-size: 5rem; opacity: 0.3; color: #fdbb2d; display: block; filter: drop-shadow(0 4px 8px rgba(253, 187, 45, 0.2));"></i>
                      </div>
                      <h4 style="position: relative; z-index: 1; font-size: 1.2rem; color: #ecf0f1; margin: 0 0 10px 0; font-weight: 600;">Sin ubicaciones registradas</h4>
                      <p style="position: relative; z-index: 1; font-size: 0.95rem; margin: 0; color: #95a5a6; font-style: italic; line-height: 1.6;">Este repartidor aún no ha actualizado su ubicación en el sistema.</p>
                    </div>
                  `}
                </div>
              `;
            }).join('');
            
            // Inicializar mapas para cada repartidor
            rutas.forEach((ruta: any) => {
              if (ruta.ubicaciones && ruta.ubicaciones.length > 0) {
                const mapId = `repartidorMap_${ruta.repartidor.id}`;
                const mapContainer = document.getElementById(mapId);
                if (mapContainer && typeof (window as any).L !== 'undefined') {
                  const L = (window as any).L;
                  const map = L.map(mapContainer).setView(
                    [ruta.ubicaciones[0].latitud, ruta.ubicaciones[0].longitud],
                    13
                  );
                  
                  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors'
                  }).addTo(map);
                  
                  // Agregar marcador inicial
                  const initialMarker = L.marker(
                    [ruta.ubicaciones[0].latitud, ruta.ubicaciones[0].longitud],
                    {
                      icon: L.divIcon({
                        className: 'repartidor-marker',
                        html: '<i class="fas fa-motorcycle" style="font-size: 24px; color: #fdbb2d;"></i>',
                        iconSize: [30, 30],
                        iconAnchor: [15, 30]
                      })
                    }
                  ).addTo(map);
                  
                  // Agregar ruta si hay múltiples ubicaciones
                  if (ruta.ubicaciones.length > 1) {
                    const routePoints = ruta.ubicaciones.map((u: any) => [u.latitud, u.longitud]);
                    const polyline = L.polyline(routePoints, {
                      color: '#fdbb2d',
                      weight: 4,
                      opacity: 0.7
                    }).addTo(map);
                    map.fitBounds(polyline.getBounds());
                  }
                  
                  // Agregar marcador final
                  if (ruta.ubicaciones.length > 1) {
                    const lastUbicacion = ruta.ubicaciones[ruta.ubicaciones.length - 1];
                    L.marker([lastUbicacion.latitud, lastUbicacion.longitud], {
                      icon: L.divIcon({
                        className: 'repartidor-marker-final',
                        html: '<i class="fas fa-map-marker-alt" style="font-size: 24px; color: #00b894;"></i>',
                        iconSize: [30, 30],
                        iconAnchor: [15, 30]
                      })
                    }).addTo(map).bindPopup(`<strong>Última ubicación</strong><br>${lastUbicacion.direccion || 'En ruta'}`);
                  }
                }
              }
            });
          },
          error: (err: any) => {
            container.innerHTML = `
              <div class="error-state">
                <i class="fas fa-exclamation-circle" style="font-size: 64px; color: #e74c3c; margin-bottom: 20px;"></i>
                <h3>Error al cargar rutas</h3>
                <p>${err?.error?.error || 'Error al cargar las rutas de repartidores'}</p>
              </div>
            `;
            console.error('Error al cargar rutas de repartidores:', err);
          }
        });
      }
      
      // Exponer función globalmente
      (window as any).loadRepartidoresRutas = loadRepartidoresRutas;

      // Funciones para modal de repartidores
      function showAddRepartidorForm() {
        const modal = document.getElementById('repartidorModal');
        const form = document.getElementById('repartidorForm') as HTMLFormElement;
        const title = document.getElementById('repartidorModalTitle');
        
        if (modal && form && title) {
          title.textContent = 'Nuevo Repartidor';
          form.reset();
          (document.getElementById('repartidorActivo') as HTMLInputElement).checked = true;
          modal.style.display = 'flex';
        }
      }

      function closeRepartidorModal() {
        const modal = document.getElementById('repartidorModal');
        if (modal) {
          modal.style.display = 'none';
        }
      }

      function saveRepartidor() {
        const form = document.getElementById('repartidorForm') as HTMLFormElement;
        if (!form) return;

        const nombre = (document.getElementById('repartidorNombre') as HTMLInputElement)?.value;
        const telefono = (document.getElementById('repartidorTelefono') as HTMLInputElement)?.value;
        const email = (document.getElementById('repartidorEmail') as HTMLInputElement)?.value;
        const vehiculo = (document.getElementById('repartidorVehiculo') as HTMLSelectElement)?.value;
        const placa = (document.getElementById('repartidorPlaca') as HTMLInputElement)?.value;
        const activo = (document.getElementById('repartidorActivo') as HTMLInputElement)?.checked;

        if (!nombre || !telefono) {
          self.showMessage('Nombre completo y teléfono son requeridos', 'error');
          return;
        }

        const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
        const buttonText = submitBtn?.querySelector('.button-text') as HTMLElement;
        const loadingSpinner = submitBtn?.querySelector('.loading-spinner') as HTMLElement;

        if (submitBtn) submitBtn.disabled = true;
        if (buttonText) buttonText.textContent = 'Guardando...';
        if (loadingSpinner) loadingSpinner.style.display = 'inline-block';

        const repartidorData = {
          nombre_completo: nombre,
          telefono: telefono,
          email: email || null,
          vehiculo: vehiculo || 'Moto',
          placa: placa || null,
          activo: activo
        };

        self.databaseService.createRepartidor(repartidorData).subscribe({
          next: (response: any) => {
            self.showMessage('Repartidor creado exitosamente', 'success');
            closeRepartidorModal();
            loadRepartidoresRutas();
            
            if (submitBtn) submitBtn.disabled = false;
            if (buttonText) buttonText.textContent = 'Guardar Repartidor';
            if (loadingSpinner) (loadingSpinner as HTMLElement).style.display = 'none';
          },
          error: (err: any) => {
            self.showMessage(err?.error?.error || 'Error al crear repartidor', 'error');
            
            if (submitBtn) submitBtn.disabled = false;
            if (buttonText) buttonText.textContent = 'Guardar Repartidor';
            if (loadingSpinner) (loadingSpinner as HTMLElement).style.display = 'none';
          }
        });
      }

      // Exponer funciones globalmente
      (window as any).showAddRepartidorForm = showAddRepartidorForm;
      (window as any).closeRepartidorModal = closeRepartidorModal;

      // Configurar evento del formulario
      setTimeout(() => {
        const repartidorForm = document.getElementById('repartidorForm') as HTMLFormElement;
        if (repartidorForm) {
          repartidorForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveRepartidor();
          });
        }
      }, 1000);

      function generateOrdersList() {
        if (!self.currentUser) return;
        
        self.databaseService.getPedidos(self.currentUser.id!).subscribe({
          next: (pedidos: any[]) => {
            if (pedidos.length === 0) {
              containers.ordersList!.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 50px;">Aún no has realizado ningún pedido.</p>';
              return;
            }

            const normalizeFn = (window as any).normalizeImageUrl || ((url: string, text: string, size: string) => url || `https://via.placeholder.com/${size}/EEE/333?text=${text}`);

            containers.ordersList!.innerHTML = pedidos.map((order: any) => {
              let statusText, statusIcon, statusClass, statusColor;
              if (order.estado === 'entregado') {
                statusText = 'Entregado';
                statusIcon = 'fa-check-circle';
                statusClass = 'status-entregado';
                statusColor = '#00b894';
              } else if (order.estado === 'pendiente') {
                statusText = 'Pendiente';
                statusIcon = 'fa-hourglass-half';
                statusClass = 'status-pendiente';
                statusColor = '#fdcb6e';
              } else if (order.estado === 'confirmado') {
                statusText = 'Confirmado';
                statusIcon = 'fa-check';
                statusClass = 'status-confirmado';
                statusColor = '#74b9ff';
              } else if (order.estado === 'en_preparacion') {
                statusText = 'En Preparación';
                statusIcon = 'fa-cog';
                statusClass = 'status-preparacion';
                statusColor = '#a29bfe';
              } else if (order.estado === 'enviado') {
                statusText = 'Enviado';
                statusIcon = 'fa-truck';
                statusClass = 'status-enviado';
                statusColor = '#fd79a8';
              } else {
                statusText = 'Cancelado';
                statusIcon = 'fa-times-circle';
                statusClass = 'status-cancelado';
                statusColor = '#636e72';
              }

              // Formatear fecha
              const fecha = new Date(order.fecha_pedido);
              const fechaFormateada = fecha.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              });
              const horaFormateada = fecha.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
              });

              // Generar lista de productos
              let productosHtml = '';
              if (order.items && order.items.length > 0) {
                productosHtml = `
                  <div class="order-products-list" style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px;">
                    ${order.items.map((item: any) => {
                      const imageUrl = normalizeFn(item.imagen || item.imagen_url || item.cerveza?.imagen_url || item.cerveza?.imagen, item.nombre || item.cerveza_nombre || 'Cerveza', '80x80');
              return `
                      <div class="order-product-item" style="display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%); border-radius: 16px; border: 2px solid rgba(255, 255, 255, 0.08); border-left: 4px solid rgba(253, 187, 45, 0.4); margin-bottom: 12px; position: relative; overflow: hidden;">
                        <div style="display: flex; align-items: center; gap: 16px; flex: 1;">
                          <div class="order-product-image" style="width: 70px; height: 70px; border-radius: 12px; overflow: hidden; flex-shrink: 0; border: 2px solid rgba(253, 187, 45, 0.3); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);">
                            <img src="${imageUrl}" alt="${item.nombre || 'Cerveza'}" onerror="this.src='https://via.placeholder.com/80x80/EEE/333?text=Cerveza'" style="width: 100%; height: 100%; object-fit: cover;">
                          </div>
                          <div class="order-product-info" style="display: flex; flex-direction: column; gap: 4px; flex: 1;">
                            <span class="order-product-name" style="font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 6px; text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3); letter-spacing: 0.3px;">${item.nombre || item.cerveza?.nombre || 'Cerveza'}</span>
                            ${item.estilo || item.cerveza?.estilo ? `<span class="order-product-style" style="font-size: 13px; color: #bdc3c7; font-style: italic; font-weight: 500;">${item.estilo || item.cerveza?.estilo}</span>` : ''}
                          </div>
                        </div>
                        <div class="order-product-details" style="display: flex; align-items: center; gap: 16px;">
                          <span class="order-product-quantity" style="font-size: 14px; color: #bdc3c7; font-weight: 600; min-width: 40px; text-align: center; padding: 4px 8px; background: rgba(255, 255, 255, 0.05); border-radius: 6px;">${item.cantidad}x</span>
                          <span class="order-product-price" style="font-size: 14px; color: #95a5a6; min-width: 60px; text-align: right;">$${Number(item.precio_unitario || item.precio || 0).toFixed(2)}</span>
                          <span class="order-product-subtotal" style="font-size: 18px; font-weight: 800; color: #fdbb2d; min-width: 90px; text-align: right; text-shadow: 0 2px 10px rgba(253, 187, 45, 0.4); letter-spacing: 0.5px;">$${Number(item.subtotal || (item.precio_unitario || item.precio || 0) * item.cantidad).toFixed(2)}</span>
                        </div>
                      </div>
                    `;
                    }).join('')}
                  </div>
                `;
              } else {
                productosHtml = `
                  <div class="order-products-empty">
                    <i class="fas fa-info-circle"></i>
                    <p>Este pedido fue creado antes de implementar el detalle de productos.</p>
                    <p class="order-products-empty-note">Los productos no están disponibles en el historial.</p>
                  </div>
                `;
              }

              return `
                <div class="order-card-enhanced" style="background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%); border-radius: 24px; padding: 0; margin-bottom: 30px; box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5), 0 4px 16px rgba(0, 0, 0, 0.3); border: 2px solid rgba(253, 187, 45, 0.25); position: relative; overflow: hidden;">
                  <div style="position: absolute; top: 0; left: 0; right: 0; height: 5px; background: linear-gradient(90deg, #fdbb2d 0%, #f9a825 50%, #fdbb2d 100%); background-size: 200% 100%; animation: shimmer 3s linear infinite; z-index: 1;"></div>
                  <div class="order-card-header" style="display: flex; justify-content: space-between; align-items: flex-start; padding: 28px 32px; background: linear-gradient(135deg, rgba(253, 187, 45, 0.12) 0%, rgba(249, 168, 37, 0.08) 100%); border-bottom: 2px solid rgba(253, 187, 45, 0.25); position: relative; overflow: hidden;">
                    <div class="order-header-main" style="flex: 1;">
                      <div class="order-number-badge" style="display: inline-flex; align-items: center; gap: 12px; font-size: 26px; font-weight: 900; color: #fdbb2d; margin-bottom: 12px; letter-spacing: 1px; text-shadow: 0 3px 15px rgba(253, 187, 45, 0.5), 0 0 20px rgba(253, 187, 45, 0.3);">
                        <span style="width: 6px; height: 40px; background: linear-gradient(135deg, #fdbb2d 0%, #f9a825 100%); border-radius: 4px; box-shadow: 0 0 15px rgba(253, 187, 45, 0.7); display: block;"></span>
                        <i class="fas fa-receipt" style="font-size: 22px;"></i>
                        <span>Pedido #${order.id}</span>
                      </div>
                      <div class="order-date-time" style="display: flex; align-items: center; gap: 20px; flex-wrap: wrap;">
                        <div class="order-date-item" style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: #bdc3c7; font-weight: 500;">
                          <i class="fas fa-calendar-alt" style="color: #7f8c8d; font-size: 13px;"></i>
                          <span>${fechaFormateada}</span>
                        </div>
                        <div class="order-date-item" style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: #bdc3c7; font-weight: 500;">
                          <i class="fas fa-clock" style="color: #7f8c8d; font-size: 13px;"></i>
                          <span>${horaFormateada}</span>
                        </div>
                      </div>
                    </div>
                    <div class="order-status-badge ${statusClass}" style="display: inline-flex; align-items: center; gap: 10px; padding: 12px 22px; border-radius: 30px; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; white-space: nowrap; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3); background: linear-gradient(135deg, ${statusColor}33 0%, ${statusColor}22 100%); color: ${statusColor}; border: 2px solid ${statusColor}80;">
                    <i class="fas ${statusIcon}"></i> 
                      <span>${statusText}</span>
                  </div>
                  </div>
                  
                  <div class="order-card-body" style="padding: 32px;">
                    <div class="order-products-section">
                      <h3 class="order-section-title" style="font-size: 18px; font-weight: 700; color: #ecf0f1; margin-bottom: 20px; display: flex; align-items: center; gap: 12px; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 12px; border-bottom: 2px solid rgba(253, 187, 45, 0.2);">
                        <i class="fas fa-shopping-bag" style="color: #fdbb2d; font-size: 16px;"></i>
                        <span>Productos (${order.items?.length || 0})</span>
                      </h3>
                      ${productosHtml}
                    </div>
                    
                    <div class="order-summary-enhanced" style="padding-top: 20px; border-top: 2px solid rgba(253, 187, 45, 0.2); display: flex; flex-direction: column; gap: 12px;">
                      <div class="order-summary-main">
                        <div class="order-total-row" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0;">
                          <span class="order-total-label" style="font-size: 18px; color: #ecf0f1; font-weight: 600; display: flex; align-items: center; gap: 10px;">
                            <i class="fas fa-dollar-sign" style="color: #fdbb2d; font-size: 16px;"></i>
                            Total del pedido
                          </span>
                          <span class="order-total-value" style="font-size: 22px; font-weight: 800; color: #fdbb2d; text-shadow: 0 3px 15px rgba(253, 187, 45, 0.5); letter-spacing: 0.5px;">$${Number(order.total).toFixed(2)}</span>
                        </div>
                        ${order.puntos_ganados > 0 ? `
                          <div class="order-points-earned" style="padding: 16px 20px; background: linear-gradient(135deg, rgba(253, 187, 45, 0.15) 0%, rgba(249, 168, 37, 0.12) 100%); border-radius: 14px; margin-top: 8px; border: 2px solid rgba(253, 187, 45, 0.3); box-shadow: 0 4px 15px rgba(253, 187, 45, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1); display: flex; align-items: center; gap: 12px;">
                            <i class="fas fa-star" style="color: #fdbb2d; font-size: 20px; filter: drop-shadow(0 2px 6px rgba(253, 187, 45, 0.5));"></i>
                            <span class="points-label" style="font-size: 15px; color: #ecf0f1; font-weight: 600;">CervezaPoints ganados:</span>
                            <span class="points-value" style="font-size: 24px; color: #fdbb2d; font-weight: 900; text-shadow: 0 0 20px rgba(253, 187, 45, 0.6), 0 3px 15px rgba(253, 187, 45, 0.4); letter-spacing: 1px;">+${order.puntos_ganados}</span>
                          </div>
                        ` : ''}
                        ${order.puntos_usados > 0 ? `
                          <div class="order-points-used" style="padding: 12px 20px; background: rgba(231, 76, 60, 0.1); border-radius: 12px; margin-top: 8px; border: 2px solid rgba(231, 76, 60, 0.3); display: flex; align-items: center; gap: 12px;">
                            <i class="fas fa-star-half-alt" style="color: #e74c3c; font-size: 18px;"></i>
                            <span class="points-label" style="font-size: 14px; color: #ecf0f1; font-weight: 600;">Puntos usados:</span>
                            <span class="points-value" style="font-size: 20px; color: #e74c3c; font-weight: 800;">-${order.puntos_usados}</span>
                          </div>
                        ` : ''}
                      </div>
                    </div>
                    ${(order.estado === 'enviado' || order.estado === 'en_preparacion') ? `
                      <div class="order-tracking-section">
                        <button class="btn-track-repartidor" onclick="showRepartidorTracking(${order.id})">
                          <i class="fas fa-map-marker-alt"></i>
                          <span>Ver Ruta del Repartidor</span>
                        </button>
                      </div>
                    ` : ''}
                  </div>
                </div>
              `;
            }).join('');
          },
          error: () => {
            containers.ordersList!.innerHTML = '<p style="text-align: center; color: #e74c3c; padding: 50px;">Error al cargar los pedidos.</p>';
          }
        });
      }
      
      function updatePointsDisplay() {
        const pointsBalanceEl = document.getElementById('pointsBalance');
        if (pointsBalanceEl) pointsBalanceEl.textContent = userPoints.toLocaleString();
      }
      
      function processCheckout() {
        if (!self.currentUser) {
          showMessage('Debes iniciar sesión para pagar.', 'error');
          return;
        }
        if (cart.length === 0) {
          showMessage('Tu carrito está vacío.', 'error');
          return;
        }

        // Obtener método de pago seleccionado
        const paymentMethod = (document.querySelector('input[name="paymentMethod"]:checked') as HTMLInputElement)?.value || 'tarjeta';
        
          // Validar información de pago según el método
        if (paymentMethod === 'tarjeta') {
          const cardNumber = (document.getElementById('cardNumber') as HTMLInputElement)?.value.replace(/\s/g, '') || '';
          const cardName = (document.getElementById('cardName') as HTMLInputElement)?.value || '';
          const cardCvv = (document.getElementById('cardCvv') as HTMLInputElement)?.value || '';
          const cardMonth = (document.getElementById('cardMonth') as HTMLSelectElement)?.value || '';
          const cardYear = (document.getElementById('cardYear') as HTMLSelectElement)?.value || '';

          if (!cardNumber || cardNumber.length < 13) {
            showMessage('Por favor ingresa un número de tarjeta válido', 'error');
            return;
          }
          if (!cardName) {
            showMessage('Por favor ingresa el nombre en la tarjeta', 'error');
            return;
          }
          if (!cardCvv || cardCvv.length < 3) {
            showMessage('Por favor ingresa el CVV de la tarjeta', 'error');
            return;
          }
          if (!cardMonth || !cardYear) {
            showMessage('Por favor selecciona la fecha de expiración', 'error');
            return;
          }

          // Validar formato básico de tarjeta (modo prueba - acepta cualquier número)
          console.log('💳 Procesando pago con tarjeta (modo prueba):', {
            numero: cardNumber.substring(0, 4) + ' **** **** ' + cardNumber.substring(cardNumber.length - 4),
            nombre: cardName,
            expiracion: `${cardMonth}/${cardYear}`
          });
        } else if (paymentMethod === 'paypal') {
          // Simular proceso de PayPal (modo prueba)
          console.log('💳 Procesando pago con PayPal (modo prueba)');
          // Mostrar modal de simulación de PayPal
          if (typeof (window as any).showPaypalPaymentModal === 'function') {
            (window as any).showPaypalPaymentModal();
          } else {
            // Si la función no está disponible, procesar directamente
            console.warn('showPaypalPaymentModal no está disponible, procesando directamente');
          }
          return; // Salir aquí, el modal manejará el proceso
        } else if (paymentMethod === 'efectivo') {
          console.log('💵 Procesando pago en efectivo');
        } else if (paymentMethod === 'transferencia') {
          console.log('🏦 Procesando pago por transferencia');
        }

        const { total, pointsToEarn } = calculateCartTotals();

        // Estado del botón de checkout
        const checkoutBtn = document.getElementById('checkoutBtn') as HTMLButtonElement | null;
        const originalText = checkoutBtn ? checkoutBtn.innerHTML : '';
        if (checkoutBtn) {
          checkoutBtn.innerHTML = '<span class="loading-spinner"></span> Procesando...';
          checkoutBtn.disabled = true;
        }

        // Crear pedido en backend
        const orderData = {
          usuario_id: self.currentUser.id,
          total,
          puntos_usados: pointsUsed,
          puntos_ganados: pointsToEarn,
          metodo_pago: paymentMethod,
          items: cart.map((item: any) => ({
            cerveza_id: item.id,
            cantidad: item.quantity,
            precio_unitario: item.price,
            subtotal: item.price * item.quantity
          }))
        };

        self.databaseService.createPedido(orderData as any).subscribe({
          next: (response: any) => {
            // Actualizar puntos del usuario
            self.databaseService.getPuntosUsuario(self.currentUser!.id!).subscribe({
              next: (puntos: any) => {
                const el = document.getElementById('pointsBalance');
                if (el) el.textContent = Number(puntos).toLocaleString();
              },
              error: (err: any) => {
                console.log('Error al cargar puntos:', err);
              }
            });

            // Limpiar carrito
            cart = [];
            appliedDiscount = 0;
            pointsUsed = 0;
            updateCartBadges();

            showView(views.orders);
            generateOrdersList();
            showMessage(`¡Pedido #${response.id} realizado con éxito! Ganaste ${pointsToEarn} CervezaPoints`, 'success');
          },
          error: (err: any) => {
            const msg = err?.error?.error || 'Error al procesar el pedido';
            showMessage(msg, 'error');
          },
          complete: () => {
            if (checkoutBtn) {
              checkoutBtn.innerHTML = originalText;
              checkoutBtn.disabled = false;
            }
          }
        });
      }
      
      // Funcionalidad del formulario de registro por pasos
      function setupSignupForm() {
        const steps = document.querySelectorAll('.form-step');
        const progressSteps = document.querySelectorAll('.progress-step');
        let currentStep = 0;
        
        function showStep(stepIndex: number) {
          steps.forEach((step, index) => {
            step.classList.toggle('active', index === stepIndex);
          });
          
          progressSteps.forEach((step, index) => {
            step.classList.toggle('active', index === stepIndex);
            step.classList.toggle('completed', index < stepIndex);
          });
          
          currentStep = stepIndex;
        }
        
        // Botones de navegación del formulario de registro
        document.getElementById('nextToStep2')?.addEventListener('click', () => {
          const name = (document.getElementById('signupName') as HTMLInputElement).value;
          const email = (document.getElementById('signupEmail') as HTMLInputElement).value;
          
          if (!name || !email) {
            showMessage('Por favor completa todos los campos', 'error');
            return;
          }
          
          showStep(1);
        });
        
        document.getElementById('backToStep1')?.addEventListener('click', () => {
          showStep(0);
        });
        
        document.getElementById('nextToStep3')?.addEventListener('click', () => {
          const password = (document.getElementById('signupPassword') as HTMLInputElement).value;
          const confirmPassword = (document.getElementById('signupConfirmPassword') as HTMLInputElement).value;
          
          if (!password || !confirmPassword) {
            showMessage('Por favor completa todos los campos', 'error');
            return;
          }
          
          if (password !== confirmPassword) {
            showMessage('Las contraseñas no coinciden', 'error');
            return;
          }
          
          showStep(2);
        });
        
        document.getElementById('backToStep2')?.addEventListener('click', () => {
          showStep(1);
        });
      }
      
      // Funcionalidad para mostrar/ocultar contraseñas
      function setupPasswordToggles() {
        const togglePassword = document.getElementById('togglePassword');
        const passwordInput = document.getElementById('password') as HTMLInputElement;
        
        const toggleSignupPassword = document.getElementById('toggleSignupPassword');
        const signupPasswordInput = document.getElementById('signupPassword') as HTMLInputElement;
        
        const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
        const confirmPasswordInput = document.getElementById('signupConfirmPassword') as HTMLInputElement;
        
        function togglePasswordVisibility(input: HTMLInputElement, toggle: HTMLElement) {
          if (input.type === 'password') {
            input.type = 'text';
            toggle.innerHTML = '<i class="fas fa-eye-slash"></i>';
          } else {
            input.type = 'password';
            toggle.innerHTML = '<i class="fas fa-eye"></i>';
          }
        }
        
        togglePassword?.addEventListener('click', () => {
          togglePasswordVisibility(passwordInput, togglePassword);
        });
        
        toggleSignupPassword?.addEventListener('click', () => {
          togglePasswordVisibility(signupPasswordInput, toggleSignupPassword);
        });
        
        toggleConfirmPassword?.addEventListener('click', () => {
          togglePasswordVisibility(confirmPasswordInput, toggleConfirmPassword);
        });
      }
      
      // Event Listeners para navegación
      navButtons.showSignup?.addEventListener('click', (e) => {
        e.preventDefault();
        showView(views.signup);
      });
      
      navButtons.backToLogin?.addEventListener('click', (e) => {
        e.preventDefault();
        showView(views.login);
      });
      
      // LOGIN (conexión a backend)
      forms.login?.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = (document.getElementById('email') as HTMLInputElement).value;
        const password = (document.getElementById('password') as HTMLInputElement).value;
        
        const button = (e.currentTarget as HTMLFormElement).querySelector('.login-button') as HTMLButtonElement;
        const originalText = button?.textContent || 'Iniciar Sesión';
        
        if (button) {
          button.innerHTML = '<span class="loading-spinner"></span> Iniciando sesión...';
          button.style.opacity = '0.7';
          button.disabled = true;
        }
        
        console.log('🔐 Intentando login con:', email);
        
        // Usar self en lugar de this para mantener el contexto
        self.databaseService.login(email, password).subscribe({
          next: (resp: any) => {
            console.log('✅ Login exitoso, respuesta:', resp);
            
            // token ya guardado en el service (tap)
            self.currentUser = resp.user;
            
            // Verificar si es admin o vendedor para redirigir al panel correspondiente
            console.log('Usuario rol:', resp.user.rol);
            console.log('Usuario completo:', resp.user);
            console.log('¿Es admin o vendedor?', resp.user.rol === 'admin' || resp.user.rol === 'vendedor');
            console.log('views disponible:', !!views);
            console.log('showView disponible:', !!showView);
            console.log('views.dashboard:', views?.dashboard);
            console.log('views.adminDashboard:', views?.adminDashboard);
            
            // Mostrar/ocultar botón de admin
            const adminBtn = document.getElementById('showAdminPanel');
            if (adminBtn) {
              if (resp.user.rol === 'admin' || resp.user.rol === 'vendedor') {
                adminBtn.style.display = 'block';
                console.log('Botón admin mostrado');
              } else {
                adminBtn.style.display = 'none';
                console.log('Botón admin ocultado');
              }
            }
            
            // Función helper para redirigir a una vista
            const redirectToView = (viewId: string, isAdmin: boolean = false) => {
              const viewElement = document.getElementById(viewId);
              if (viewElement) {
                // Ocultar todas las vistas
                document.querySelectorAll('.view').forEach((v: any) => {
                  if (v && v.classList) {
                    v.classList.remove('active');
                  }
                });
                // Mostrar la vista objetivo
                viewElement.classList.add('active');
                
                if (isAdmin && typeof loadAdminStats === 'function') {
                  loadAdminStats();
                }
                
                return true;
              }
              return false;
            };
            
            // Redirigir inmediatamente sin delay
            console.log('🔄 Iniciando redirección...');
            
            // Función helper para cambiar de vista
            const cambiarVista = (viewId: string) => {
              console.log(`Buscando vista: ${viewId}`);
              const targetView = document.getElementById(viewId);
              const loginView = document.getElementById('loginView');
              
              if (!targetView) {
                console.error(`❌ Vista ${viewId} no encontrada`);
                return false;
              }
              
              // Ocultar todas las vistas de forma explícita
              const allViews = document.querySelectorAll('.view');
              console.log(`Encontradas ${allViews.length} vistas`);
              allViews.forEach((v: any) => {
                if (v && v.classList) {
                  v.classList.remove('active');
                  console.log(`Removido 'active' de: ${v.id || 'sin id'}`);
                }
              });
              
              // Ocultar loginView específicamente
              if (loginView && loginView.classList) {
                loginView.classList.remove('active');
                loginView.style.display = 'none';
                console.log('✅ loginView ocultado');
              }
              
              // Mostrar vista objetivo
              targetView.classList.add('active');
              targetView.style.display = 'block';
              console.log(`✅ Vista ${viewId} activada y visible`);
              
              return true;
            };
            
            if (resp.user.rol === 'admin' || resp.user.rol === 'vendedor') {
              console.log('→ Redirigiendo a panel de admin');
              if (cambiarVista('adminDashboardView')) {
                if (typeof loadAdminStats === 'function') {
              loadAdminStats();
                }
                // No mostrar mensaje aquí, ya se mostró arriba
            } else {
                showMessage('Error: Vista de admin no encontrada', 'error');
              }
            } else {
              console.log('→ Redirigiendo a dashboard normal');
              if (cambiarVista('dashboardView')) {
              // cargar puntos del backend solo para clientes
              self.databaseService.getPuntosUsuario(resp.user.id!).subscribe({
                next: (puntos: any) => {
                  const el = document.getElementById('pointsBalance');
                  if (el) el.textContent = Number(puntos).toLocaleString();
                },
                error: (err: any) => {
                  console.log('Error al cargar puntos:', err);
                }
              });
                // No mostrar mensaje aquí, ya se mostró arriba
              } else {
                showMessage('Error: Vista de dashboard no encontrada', 'error');
            }
            }
            
            if (button) {
              button.textContent = originalText;
              button.style.opacity = '1';
              button.disabled = false;
            }
            (forms.login as HTMLFormElement).reset();
          },
          error: (err: any) => {
            console.error('❌ Error en login:', err);
            const msg = err?.error?.error || err?.message || 'Credenciales inválidas';
            showMessage(msg, 'error');
            if (button) {
              button.textContent = originalText;
              button.style.opacity = '1';
              button.disabled = false;
            }
          }
        });
      });
      
      // REGISTRO
      forms.signup?.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Recopilar todos los datos del formulario
        const formData = {
          // Paso 0: Verificación de identidad
          idType: (document.getElementById('idType') as HTMLSelectElement)?.value,
          idNumber: (document.getElementById('idNumber') as HTMLInputElement)?.value,
          idPhotoFront: (document.getElementById('idPhotoFront') as HTMLInputElement)?.files?.[0],
          idPhotoBack: (document.getElementById('idPhotoBack') as HTMLInputElement)?.files?.[0],
          
          // Paso 1: Datos personales
          name: (document.getElementById('signupName') as HTMLInputElement)?.value,
          email: (document.getElementById('signupEmail') as HTMLInputElement)?.value,
          
          // Paso 2: Contraseñas
          password: (document.getElementById('signupPassword') as HTMLInputElement)?.value,
          confirmPassword: (document.getElementById('signupConfirmPassword') as HTMLInputElement)?.value,
          
          // Paso 3: Información adicional
          birthDate: (document.getElementById('signupAge') as HTMLInputElement)?.value,
          phone: (document.getElementById('signupPhone') as HTMLInputElement)?.value,
          address: (document.getElementById('signupAddress') as HTMLTextAreaElement)?.value,
          confirmLegalAge: (document.getElementById('confirmLegalAge') as HTMLInputElement)?.checked,
          acceptTerms: (document.getElementById('acceptTerms') as HTMLInputElement)?.checked
        };
        
        // Validaciones finales completas
        const validationErrors: string[] = [];
        
        // Validar Paso 0: Verificación de identidad
        if (!formData.idType || formData.idType === '') {
          validationErrors.push('Debes seleccionar un tipo de identificación');
        }
        
        if (!formData.idNumber || formData.idNumber.length < 5 || formData.idNumber.length > 20) {
          validationErrors.push('El número de identificación debe tener entre 5 y 20 caracteres');
        }
        
        if (!/^[A-Z0-9]+$/.test(formData.idNumber || '')) {
          validationErrors.push('El número de identificación solo puede contener letras mayúsculas y números');
        }
        
        if (!formData.idPhotoFront) {
          validationErrors.push('Debes subir la foto del frente de tu identificación');
        } else {
          const maxSize = 5 * 1024 * 1024; // 5MB
          if (formData.idPhotoFront.size > maxSize) {
            validationErrors.push('La foto del frente no puede exceder 5MB');
          }
          const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
          if (!allowedTypes.includes(formData.idPhotoFront.type)) {
            validationErrors.push('La foto del frente debe ser JPG, JPEG o PNG');
          }
        }
        
        if (!formData.idPhotoBack) {
          validationErrors.push('Debes subir la foto del reverso de tu identificación');
        } else {
          const maxSize = 5 * 1024 * 1024; // 5MB
          if (formData.idPhotoBack.size > maxSize) {
            validationErrors.push('La foto del reverso no puede exceder 5MB');
          }
          const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
          if (!allowedTypes.includes(formData.idPhotoBack.type)) {
            validationErrors.push('La foto del reverso debe ser JPG, JPEG o PNG');
          }
        }
        
        // Validar Paso 1: Datos personales
        if (!formData.name || formData.name.trim().length < 3) {
          validationErrors.push('El nombre debe tener al menos 3 caracteres');
        }
        
        if (!formData.name || !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(formData.name.trim())) {
          validationErrors.push('El nombre solo puede contener letras y espacios');
        }
        
        if (!formData.email || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email.trim())) {
          validationErrors.push('Debes ingresar un correo electrónico válido');
        }
        
        // Validar Paso 2: Contraseñas
        if (!formData.password || formData.password.length < 8) {
          validationErrors.push('La contraseña debe tener al menos 8 caracteres');
        }
        
        const passwordRequirements = {
          uppercase: /[A-Z]/.test(formData.password || ''),
          lowercase: /[a-z]/.test(formData.password || ''),
          number: /[0-9]/.test(formData.password || ''),
          special: /[@$!%*?&]/.test(formData.password || '')
        };
        
        if (!passwordRequirements.uppercase) {
          validationErrors.push('La contraseña debe contener al menos una letra mayúscula');
        }
        if (!passwordRequirements.lowercase) {
          validationErrors.push('La contraseña debe contener al menos una letra minúscula');
        }
        if (!passwordRequirements.number) {
          validationErrors.push('La contraseña debe contener al menos un número');
        }
        if (!passwordRequirements.special) {
          validationErrors.push('La contraseña debe contener al menos un carácter especial (@$!%*?&)');
        }
        
        if (formData.password !== formData.confirmPassword) {
          validationErrors.push('Las contraseñas no coinciden');
        }

        // Validar Paso 3: Información adicional
        if (!formData.birthDate) {
          validationErrors.push('Debes ingresar tu fecha de nacimiento');
        } else {
        const birthDate = new Date(formData.birthDate);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }

        if (age < 18) {
            validationErrors.push(`Debes ser mayor de 18 años para registrarte. Edad calculada: ${age} años`);
          }
        }
        
        if (!formData.phone || formData.phone.trim().length < 10) {
          validationErrors.push('El teléfono debe tener al menos 10 dígitos');
        }
        
        if (!formData.address || formData.address.trim().length < 10) {
          validationErrors.push('La dirección debe tener al menos 10 caracteres');
        }

        if (!formData.confirmLegalAge) {
          validationErrors.push('Debes confirmar que eres mayor de edad');
        }

        if (!formData.acceptTerms) {
          validationErrors.push('Debes aceptar los términos y condiciones');
        }
        
        // Mostrar todos los errores si hay alguno
        if (validationErrors.length > 0) {
          const errorMessage = '<strong>Por favor corrige los siguientes errores:</strong><ul style="margin: 10px 0; padding-left: 20px;">' +
            validationErrors.map(err => `<li>${err}</li>`).join('') +
            '</ul>';
          showMessage(errorMessage, 'error', false);
          return;
        }

        const button = (e.currentTarget as HTMLFormElement).querySelector('.step-btn.next') as HTMLButtonElement;
        const originalText = button.textContent;
        
        button.innerHTML = '<span class="loading-spinner"></span> Creando cuenta...';
        button.style.opacity = '0.7';
        button.disabled = true;
        
        // Subir archivos si existen
        const uploads: Promise<{frontUrl?: string; backUrl?: string}> = (async () => {
          const out: any = {};
          if (formData.idPhotoFront) {
            const r = await self.databaseService.uploadFile(formData.idPhotoFront, 'identificacion_frente').toPromise();
            out.frontUrl = r?.url;
          }
          if (formData.idPhotoBack) {
            const r2 = await self.databaseService.uploadFile(formData.idPhotoBack, 'identificacion_reverso').toPromise();
            out.backUrl = r2?.url;
          }
          return out;
        })();

        uploads.then(urls => {
          const payload: any = {
            nombre_completo: formData.name,
            email: formData.email,
            password: formData.password,
            telefono: formData.phone,
            direccion: formData.address,
            fecha_nacimiento: formData.birthDate,
            tipo_identificacion: formData.idType,
            numero_identificacion: formData.idNumber,
            foto_identificacion_frente: urls.frontUrl,
            foto_identificacion_reverso: urls.backUrl,
            confirmo_mayor_edad: formData.confirmLegalAge,
            acepto_terminos: formData.acceptTerms
          };

          self.databaseService.register(payload).subscribe({
            next: () => {
              showMessage('¡Cuenta creada exitosamente! Bienvenido a Cerveza Premium 🍻', 'success');
              (forms.signup as HTMLFormElement).reset();
              document.querySelectorAll('.form-step').forEach(step => step.classList.remove('active'));
              document.getElementById('step0')?.classList.add('active');
              document.querySelectorAll('.progress-step').forEach((step, index) => {
                step.classList.toggle('active', index === 0);
              });
              setTimeout(() => {
                showView(views.login);
              }, 1500);
              button.textContent = originalText;
              button.style.opacity = '1';
              button.disabled = false;
            },
            error: (err: any) => {
              const msg = err?.error?.error || 'No se pudo crear la cuenta';
              showMessage(msg, 'error');
              button.textContent = originalText;
              button.style.opacity = '1';
              button.disabled = false;
            }
          });
        }).catch(() => {
          showMessage('Error subiendo documentos. Intenta de nuevo.', 'error');
          button.textContent = originalText;
          button.style.opacity = '1';
          button.disabled = false;
        });
      });
      
      // Navegación del Dashboard
      // Nota: Los event listeners originales se mantienen para compatibilidad
      // pero ahora también tenemos métodos públicos que llaman directamente a las funciones
      navButtons.showCatalog?.addEventListener('click', () => {
        if (generateBeerCatalog) {
          generateBeerCatalog();
          showView(views.catalog);
        }
      });
      
      navButtons.showCart?.addEventListener('click', () => {
        if (renderCart) {
          renderCart();
          showView(views.cart);
        }
      });
      
      navButtons.showOrders?.addEventListener('click', () => {
        if (generateOrdersList) {
          generateOrdersList();
          showView(views.orders);
        }
      });

      // Flag para evitar múltiples peticiones simultáneas
      let isLoadingProfile = false;
      
      navButtons.showProfile?.addEventListener('click', () => {
        if (self.currentUser && !isLoadingProfile) {
          isLoadingProfile = true;
          // Cargar datos del perfil
          self.databaseService.getUsuario(self.currentUser.id!).subscribe({
            next: (userData: any) => {
              // Llenar formulario con datos actuales
              const form = document.getElementById('profileForm') as HTMLFormElement;
              if (form) {
                const nameInput = form.querySelector('[name="name"]') as HTMLInputElement;
                const phoneInput = form.querySelector('[name="phone"]') as HTMLInputElement;
                const addressInput = form.querySelector('[name="address"]') as HTMLInputElement;
                const birthDateInput = form.querySelector('[name="birthDate"]') as HTMLInputElement;
                
                if (nameInput) nameInput.value = userData.nombre_completo || '';
                if (phoneInput) phoneInput.value = userData.telefono || '';
                if (addressInput) addressInput.value = userData.direccion || '';
                if (birthDateInput && userData.fecha_nacimiento) {
                  // Asegurar formato yyyy-MM-dd para el input type="date"
                  birthDateInput.value = userData.fecha_nacimiento.substring(0, 10);
                }
              }
              
              // Actualizar información del header
              const profileDisplayName = document.getElementById('profileDisplayName');
              const profileDisplayEmail = document.getElementById('profileDisplayEmail');
              const profilePoints = document.getElementById('profilePoints');
              const avatarInitials = document.getElementById('avatarInitials');
              
              if (profileDisplayName) profileDisplayName.textContent = userData.nombre_completo || 'Usuario';
              if (profileDisplayEmail) profileDisplayEmail.textContent = userData.email || '';
              if (profilePoints) profilePoints.textContent = `${userData.puntos_acumulados || 0} puntos`;
              if (avatarInitials) {
                const initials = (userData.nombre_completo || 'U').charAt(0) + 
                                (userData.nombre_completo?.split(' ')[1]?.charAt(0) || '');
                avatarInitials.textContent = initials;
              }
              
              // Cargar estadísticas (verificar que currentUser exista)
              if (self.currentUser && self.currentUser.id != null) {
                loadProfileStats(self.currentUser.id);
              }
              isLoadingProfile = false;
            },
            error: (err: any) => {
              console.log('Error al cargar datos del usuario:', err);
              isLoadingProfile = false;
            }
          });
        }
        showView(views.profile);
      });
      
      // Función para cargar estadísticas del perfil
      function loadProfileStats(userId: number) {
        // Cargar pedidos
        self.databaseService.getPedidos(userId).subscribe({
          next: (pedidos: any[]) => {
            const totalOrdersEl = document.getElementById('totalOrders');
            if (totalOrdersEl) totalOrdersEl.textContent = pedidos.length.toString();
          },
          error: () => {
            const totalOrdersEl = document.getElementById('totalOrders');
            if (totalOrdersEl) totalOrdersEl.textContent = '0';
          }
        });
        
        // Cargar favoritos
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        const totalFavoritesEl = document.getElementById('totalFavorites');
        if (totalFavoritesEl) totalFavoritesEl.textContent = favorites.length.toString();
        
        // Fecha de registro
        if (self.currentUser?.fecha_registro) {
          const memberSinceEl = document.getElementById('memberSince');
          if (memberSinceEl) {
            const year = new Date(self.currentUser.fecha_registro).getFullYear();
            memberSinceEl.textContent = year.toString();
          }
        }
      }
      
      // Funcionalidad de tabs del perfil
      const profileTabs = document.querySelectorAll('.profile-tab');
      profileTabs.forEach(tab => {
        tab.addEventListener('click', () => {
          const tabName = tab.getAttribute('data-tab');
          
          // Remover active de todos los tabs
          profileTabs.forEach(t => t.classList.remove('active'));
          document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
          
          // Agregar active al tab seleccionado
          tab.classList.add('active');
          
          // Mostrar el contenido correspondiente
          if (tabName === 'personal') {
            document.getElementById('personalTab')?.classList.add('active');
          } else if (tabName === 'security') {
            document.getElementById('securityTab')?.classList.add('active');
          } else if (tabName === 'preferences') {
            document.getElementById('preferencesTab')?.classList.add('active');
          }
        });
      });
      
      // Funcionalidad de cambio de contraseña
      const changePasswordForm = document.getElementById('changePasswordForm');
      if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', function(e) {
          e.preventDefault();
          
          if (!self.currentUser) return;
          
          const formData = new FormData(e.target as HTMLFormElement);
          const currentPassword = formData.get('currentPassword') as string;
          const newPassword = formData.get('newPassword') as string;
          const confirmPassword = formData.get('confirmPassword') as string;
          
          // Validaciones
          if (!currentPassword || !newPassword || !confirmPassword) {
            showMessage('Por favor completa todos los campos', 'error');
            return;
          }
          
          if (newPassword.length < 8) {
            showMessage('La nueva contraseña debe tener al menos 8 caracteres', 'error');
            return;
          }
          
          if (newPassword !== confirmPassword) {
            showMessage('Las contraseñas no coinciden', 'error');
            return;
          }
          
          // Aquí deberías llamar a un servicio para cambiar la contraseña
          // Por ahora solo mostramos un mensaje
          showMessage('Funcionalidad de cambio de contraseña en desarrollo', 'info');
          
          // Limpiar formulario
          (e.target as HTMLFormElement).reset();
        });
      }
      
      // Validación de fuerza de contraseña
      const newPasswordInput = document.getElementById('newPassword');
      if (newPasswordInput) {
        newPasswordInput.addEventListener('input', function() {
          const password = (this as HTMLInputElement).value;
          const strengthEl = document.getElementById('newPasswordStrength');
          
          if (!strengthEl) return;
          
          let strength = 0;
          let strengthText = '';
          let strengthColor = '';
          
          if (password.length >= 8) strength++;
          if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
          if (password.match(/\d/)) strength++;
          if (password.match(/[^a-zA-Z\d]/)) strength++;
          
          if (strength === 0) {
            strengthText = '';
            strengthColor = 'transparent';
          } else if (strength === 1) {
            strengthText = 'Débil';
            strengthColor = '#e74c3c';
          } else if (strength === 2) {
            strengthText = 'Regular';
            strengthColor = '#f39c12';
          } else if (strength === 3) {
            strengthText = 'Buena';
            strengthColor = '#3498db';
          } else {
            strengthText = 'Muy Fuerte';
            strengthColor = '#27ae60';
          }
          
          if (password.length > 0) {
            strengthEl.innerHTML = `<span style="color: ${strengthColor}; font-weight: 600;">${strengthText}</span>`;
            strengthEl.style.display = 'block';
          } else {
            strengthEl.style.display = 'none';
          }
        });
      }
      
      // Funcionalidad de preferencias
      (window as any).savePreferences = function() {
        const preferences = {
          emailNotifications: (document.getElementById('emailNotifications') as HTMLInputElement)?.checked || false,
          promoNotifications: (document.getElementById('promoNotifications') as HTMLInputElement)?.checked || false,
          orderNotifications: (document.getElementById('orderNotifications') as HTMLInputElement)?.checked || false,
          darkMode: (document.getElementById('darkMode') as HTMLInputElement)?.checked || false
        };
        
        localStorage.setItem('userPreferences', JSON.stringify(preferences));
        
        // Las notificaciones por email se enviarán automáticamente cuando:
        // - Se registre un nuevo usuario (email de bienvenida)
        // - Se cree un pedido (email de confirmación)
        // - Se actualice el estado de un pedido (email de actualización)
        showMessage('Preferencias guardadas exitosamente', 'success');
      };
      
      // Cargar preferencias guardadas
      const savedPreferences = localStorage.getItem('userPreferences');
      if (savedPreferences) {
        try {
          const prefs = JSON.parse(savedPreferences);
          const emailNotif = document.getElementById('emailNotifications') as HTMLInputElement;
          const promoNotif = document.getElementById('promoNotifications') as HTMLInputElement;
          const orderNotif = document.getElementById('orderNotifications') as HTMLInputElement;
          const darkMode = document.getElementById('darkMode') as HTMLInputElement;
          
          if (emailNotif) emailNotif.checked = prefs.emailNotifications;
          if (promoNotif) promoNotif.checked = prefs.promoNotifications;
          if (orderNotif) orderNotif.checked = prefs.orderNotifications;
          if (darkMode) darkMode.checked = prefs.darkMode;
        } catch (e) {
          console.error('Error al cargar preferencias:', e);
        }
      }
      
      // Funcionalidad de toggle de contraseña
      (window as any).togglePassword = function(inputId: string) {
        const input = document.getElementById(inputId) as HTMLInputElement;
        const button = input?.nextElementSibling as HTMLElement;
        
        if (input && button) {
          if (input.type === 'password') {
            input.type = 'text';
            button.querySelector('i')?.classList.replace('fa-eye', 'fa-eye-slash');
          } else {
            input.type = 'password';
            button.querySelector('i')?.classList.replace('fa-eye-slash', 'fa-eye');
          }
        }
      };
      
      // Event listener para el botón de admin panel (con verificación adicional)
      const adminPanelBtn = document.getElementById('showAdminPanel');
      if (adminPanelBtn) {
        adminPanelBtn.addEventListener('click', () => {
          (window as any).showAdminLogin();
        });
      }

      // ========== NUEVOS EVENT LISTENERS ==========

      // Data local para las nuevas funcionalidades
      // NOTA: Para ver los datos de ejemplo, abre la consola y ejecuta: localStorage.clear()
      let favorites: any[] = JSON.parse(localStorage.getItem('favorites') || '[]');
      
      // Si no hay favoritos, agregar algunos de ejemplo
      if (favorites.length === 0) {
        favorites = [
          {
            id: 101,
            name: 'Corona Extra',
            style: 'Lager',
            price: 25.50,
            points: 25,
            image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400'
          },
          {
            id: 102,
            name: 'Victoria',
            style: 'Vienna Lager',
            price: 22.00,
            points: 22,
            image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400'
          },
          {
            id: 103,
            name: 'Modelo Especial',
            style: 'Pilsner',
            price: 24.00,
            points: 24,
            image: 'https://images.unsplash.com/photo-1618885472179-5e474019f2a9?w=400'
          }
        ];
        localStorage.setItem('favorites', JSON.stringify(favorites));
      }
      
      let addresses: any[] = JSON.parse(localStorage.getItem('addresses') || '[]');
      
      // Si no hay direcciones, agregar algunas de ejemplo
      if (addresses.length === 0) {
        addresses = [
          {
            label: '🏠 Casa',
            street: 'Av. Revolución 1234, Col. San Ángel',
            city: 'Ciudad de México',
            state: 'CDMX',
            zipCode: '01000',
            phone: '55 1234 5678',
            default: true
          },
          {
            label: '🏢 Oficina',
            street: 'Paseo de la Reforma 505, Piso 12',
            city: 'Ciudad de México',
            state: 'CDMX',
            zipCode: '06500',
            phone: '55 8765 4321',
            default: false
          }
        ];
        localStorage.setItem('addresses', JSON.stringify(addresses));
      }
      
      // Cargar notificaciones desde localStorage o usar valores por defecto
      let savedNotificationsData = localStorage.getItem('notifications');
      let notifications: any[] = [];
      
      if (savedNotificationsData) {
        try {
          notifications = JSON.parse(savedNotificationsData);
        } catch (e) {
          console.error('Error al cargar notificaciones:', e);
          notifications = [];
        }
      }
      
      // Si no hay notificaciones guardadas, crear algunas de ejemplo
      if (notifications.length === 0) {
        notifications = [
          {
            id: 1,
            type: 'success',
            title: '✅ Pedido Entregado',
            message: 'Tu pedido #12345 ha sido entregado exitosamente. ¡Gracias por tu compra!',
            time: '2 horas atrás',
            unread: true,
            date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 2,
            type: 'promo',
            title: '🎉 Nueva Promoción',
            message: '¡15% de descuento en todas las IPAs! Usa código: IPA15',
            time: '1 día atrás',
            unread: true,
            date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 3,
            type: 'order',
            title: '📦 Pedido en Preparación',
            message: 'Tu pedido #12346 está siendo preparado. Te notificaremos cuando esté en camino.',
            time: '3 días atrás',
            unread: false,
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 4,
            type: 'points',
            title: '⭐ Puntos Ganados',
            message: 'Has ganado 150 puntos por tu última compra. ¡Sigue acumulando!',
            time: '3 días atrás',
            unread: false,
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 5,
            type: 'warning',
            title: '⚠️ Puntos por Expirar',
            message: 'Tienes 500 puntos que expiran en 30 días. ¡Úsalos antes de que se pierdan!',
            time: '1 semana atrás',
            unread: false,
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          }
        ];
        localStorage.setItem('notifications', JSON.stringify(notifications));
      }
      let userSettings = JSON.parse(localStorage.getItem('userSettings') || JSON.stringify({
        emailNotifications: true,
        promotionNotifications: true,
        orderNotifications: true,
        publicProfile: false,
        shareData: false,
        theme: 'dark'
      }));

      // Funciones auxiliares
      const saveFavorites = () => localStorage.setItem('favorites', JSON.stringify(favorites));
      const saveAddresses = () => localStorage.setItem('addresses', JSON.stringify(addresses));
      const saveSettings = () => localStorage.setItem('userSettings', JSON.stringify(userSettings));

      // Inicializar badges
      const updateBadges = () => {
        // Badge de favoritos
        const favoritesBadge = document.getElementById('favoritesBadge');
        if (favoritesBadge) {
          if (favorites.length > 0) {
            favoritesBadge.textContent = favorites.length.toString();
            favoritesBadge.style.display = 'flex';
          } else {
            favoritesBadge.style.display = 'none';
          }
        }

        // Badge de notificaciones
        const unreadCount = notifications.filter(n => n.unread).length;
        const notificationBadge = document.getElementById('notificationBadge');
        if (notificationBadge) {
          if (unreadCount > 0) {
            notificationBadge.textContent = unreadCount.toString();
            notificationBadge.style.display = 'flex';
          } else {
            notificationBadge.style.display = 'none';
          }
        }
      };

      // Llamar a updateBadges al cargar
      setTimeout(() => {
        updateBadges();
        console.log('✓ Badges inicializados - Favoritos:', favorites.length, 'Notificaciones sin leer:', notifications.filter(n => n.unread).length);
      }, 500);

      // Funciones de renderizado
      const renderFavorites = () => {
        const favoritesGrid = document.querySelector('.favorites-grid');
        if (!favoritesGrid) return;

        if (favorites.length === 0) {
          favoritesGrid.innerHTML = `
            <div class="empty-favorites" style="grid-column: 1 / -1; text-align: center; padding: 80px 20px;">
              <i class="fas fa-heart" style="font-size: 80px; color: #e74c3c; margin-bottom: 20px; opacity: 0.3;"></i>
              <h3 style="color: #fdbb2d; margin-bottom: 15px; font-size: 24px;">Aún no tienes cervezas favoritas</h3>
              <p style="opacity: 0.7; margin-bottom: 25px; font-size: 16px;">Explora nuestro catálogo y haz clic en el corazón ❤️ para guardar tus cervezas favoritas</p>
              <button onclick="document.getElementById('showCatalog').click()" style="background: linear-gradient(145deg, #fdbb2d, #f9a825); color: #1a1a1a; border: none; padding: 15px 30px; border-radius: 10px; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.3s ease;">
                <i class="fas fa-beer"></i> Ir al Catálogo
              </button>
            </div>
          `;
        } else {
          favoritesGrid.innerHTML = favorites.map(beer => `
            <div class="favorite-card">
              <button class="remove-favorite" onclick="removeFavorite(${beer.id})">
                <i class="fas fa-times"></i>
              </button>
              <img src="${normalizeImageUrl(beer.image, beer.name)}" alt="${beer.name}">
              <h3>${beer.name}</h3>
              <p style="color: #7f8c8d; margin: 10px 0;">${beer.style}</p>
              <p style="color: #fdbb2d; font-size: 24px; font-weight: 700;">$${beer.price}</p>
              <button onclick="addToCart(${beer.id})" style="width: 100%; padding: 12px; background: #fdbb2d; border: none; border-radius: 8px; color: #1a1a1a; font-weight: 700; cursor: pointer; margin-top: 15px;">
                <i class="fas fa-shopping-cart"></i> Agregar al Carrito
              </button>
            </div>
          `).join('');
        }

        // Actualizar badge
        const favoritesBadge = document.getElementById('favoritesBadge');
        if (favoritesBadge) {
          if (favorites.length > 0) {
            favoritesBadge.textContent = favorites.length.toString();
            favoritesBadge.style.display = 'flex';
          } else {
            favoritesBadge.style.display = 'none';
          }
        }
      };

      const renderAddresses = () => {
        const addressesList = document.querySelector('.addresses-list');
        if (!addressesList) return;

        if (addresses.length === 0) {
          addressesList.innerHTML = `
            <div class="empty-state">
              <div class="empty-icon">
                <i class="fas fa-map-marker-alt"></i>
              </div>
              <h3>No tienes direcciones guardadas</h3>
              <p>Agrega tus direcciones de envío para hacer tus pedidos más rápido</p>
              <button class="btn-primary" onclick="addAddress()">
                <i class="fas fa-plus"></i> Agregar Primera Dirección
              </button>
            </div>
          `;
        } else {
          addressesList.innerHTML = addresses.map((addr, index) => `
            <div class="address-card ${addr.default ? 'default' : ''}" data-index="${index}">
              <div class="address-card-header">
                <div class="address-label-section">
                  ${addr.default ? '<span class="default-badge"><i class="fas fa-star"></i> Predeterminada</span>' : ''}
                  <h4 class="address-label">
                    <i class="fas fa-${addr.label === 'Casa' ? 'home' : addr.label === 'Oficina' ? 'briefcase' : 'map-marker-alt'}"></i>
                    ${addr.label}
                  </h4>
                </div>
              <div class="address-actions">
                  ${!addr.default ? `
                    <button class="btn-icon" onclick="setDefaultAddress(${index})" title="Establecer como predeterminada">
                      <i class="fas fa-star"></i>
                    </button>
                  ` : ''}
                  <button class="btn-icon" onclick="editAddress(${index})" title="Editar">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn-icon danger" onclick="deleteAddress(${index})" title="Eliminar">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
              <div class="address-card-body">
                <div class="address-info">
                  <p class="address-line">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${addr.street}</span>
                  </p>
                  <p class="address-line">
                    <i class="fas fa-city"></i>
                    <span>${addr.city}, ${addr.state}</span>
                  </p>
                  <p class="address-line">
                    <i class="fas fa-mail-bulk"></i>
                    <span>CP: ${addr.zipCode}</span>
                  </p>
                  ${addr.phone ? `
                    <p class="address-line">
                      <i class="fas fa-phone"></i>
                      <span>${addr.phone}</span>
                    </p>
                  ` : ''}
                  ${addr.reference ? `
                    <p class="address-line reference">
                      <i class="fas fa-info-circle"></i>
                      <span>${addr.reference}</span>
                    </p>
                  ` : ''}
                </div>
              </div>
            </div>
          `).join('');
        }
      };

      // Variable para el filtro actual
      let currentNotificationFilter: 'all' | 'unread' | 'read' = 'all';
      
      const renderNotifications = () => {
        const notificationsList = document.getElementById('notificationsListContainer');
        const emptyState = document.getElementById('notificationsEmpty');
        if (!notificationsList) return;

        // Filtrar notificaciones según el filtro actual
        let filteredNotifications = notifications;
        if (currentNotificationFilter === 'unread') {
          filteredNotifications = notifications.filter(n => n.unread);
        } else if (currentNotificationFilter === 'read') {
          filteredNotifications = notifications.filter(n => !n.unread);
        }

        // Actualizar estadísticas
        const unreadCount = notifications.filter(n => n.unread).length;
        const readCount = notifications.filter(n => !n.unread).length;
        const totalCount = notifications.length;

        const statsUnread = document.getElementById('statsUnread');
        const statsRead = document.getElementById('statsRead');
        const statsTotal = document.getElementById('statsTotal');
        const notificationsTotalCount = document.getElementById('notificationsTotalCount');
        const unreadCountBadge = document.getElementById('unreadCountBadge');

        if (statsUnread) statsUnread.textContent = unreadCount.toString();
        if (statsRead) statsRead.textContent = readCount.toString();
        if (statsTotal) statsTotal.textContent = totalCount.toString();
        if (notificationsTotalCount) notificationsTotalCount.textContent = totalCount.toString();
        if (unreadCountBadge) {
          unreadCountBadge.textContent = unreadCount.toString();
          unreadCountBadge.style.display = unreadCount > 0 ? 'inline-flex' : 'none';
        }

        // Mostrar/ocultar estado vacío
        if (filteredNotifications.length === 0) {
          notificationsList.style.display = 'none';
          if (emptyState) emptyState.style.display = 'block';
        } else {
          notificationsList.style.display = 'block';
          if (emptyState) emptyState.style.display = 'none';

          notificationsList.innerHTML = filteredNotifications.map(notif => {
            const typeIcons: { [key: string]: string } = {
              'success': 'check-circle',
              'promo': 'gift',
              'warning': 'exclamation-triangle',
              'info': 'info-circle',
              'order': 'shopping-bag',
              'points': 'star'
            };
            const typeColors: { [key: string]: string } = {
              'success': '#27ae60',
              'promo': '#e74c3c',
              'warning': '#f39c12',
              'info': '#3498db',
              'order': '#9b59b6',
              'points': '#fdbb2d'
            };

            return `
              <div class="notification-item ${notif.unread ? 'unread' : ''}" data-id="${notif.id}" data-type="${notif.type}">
                <div class="notification-icon" style="background: ${typeColors[notif.type] || '#3498db'}20; color: ${typeColors[notif.type] || '#3498db'};">
                  <i class="fas fa-${typeIcons[notif.type] || 'info-circle'}"></i>
                </div>
                <div class="notification-content">
                  <div class="notification-header">
                    <h4>${notif.title}</h4>
                    <span class="notification-type-badge ${notif.type}">${notif.type === 'success' ? 'Éxito' : notif.type === 'promo' ? 'Promoción' : notif.type === 'warning' ? 'Advertencia' : notif.type === 'order' ? 'Pedido' : notif.type === 'points' ? 'Puntos' : 'Info'}</span>
                  </div>
                  <p class="notification-message">${notif.message}</p>
                  <div class="notification-footer">
                    <span class="notification-time">
                      <i class="fas fa-clock"></i> ${notif.time}
                    </span>
                    ${notif.unread ? `
                      <button class="mark-read-btn" onclick="markNotificationAsRead(${notif.id})" title="Marcar como leída">
                        <i class="fas fa-check"></i> Marcar como leída
                      </button>
                    ` : `
                      <span class="read-indicator">
                        <i class="fas fa-check-double"></i> Leída
                      </span>
                    `}
                  </div>
                </div>
                <div class="notification-actions">
                  ${notif.unread ? `
                    <button class="notification-action-btn" onclick="markNotificationAsRead(${notif.id})" title="Marcar como leída">
                      <i class="fas fa-check"></i>
                    </button>
                  ` : ''}
                  <button class="notification-action-btn delete" onclick="deleteNotification(${notif.id})" title="Eliminar">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            `;
          }).join('');
        }

        // Actualizar badge en el menú
        const notificationBadge = document.getElementById('notificationBadge');
        if (notificationBadge) {
          if (unreadCount > 0) {
            notificationBadge.textContent = unreadCount.toString();
            notificationBadge.style.display = 'flex';
          } else {
            notificationBadge.style.display = 'none';
          }
        }
      };

      // Funciones globales para notificaciones
      (window as any).markNotificationAsRead = function(id: number) {
        const notif = notifications.find(n => n.id === id);
        if (notif) {
          notif.unread = false;
          localStorage.setItem('notifications', JSON.stringify(notifications));
          renderNotifications();
          updateBadges();
          showMessage('Notificación marcada como leída', 'success');
        }
      };

      (window as any).deleteNotification = function(id: number) {
        if (confirm('¿Estás seguro de que quieres eliminar esta notificación?')) {
          notifications = notifications.filter(n => n.id !== id);
          localStorage.setItem('notifications', JSON.stringify(notifications));
          renderNotifications();
          updateBadges();
          showMessage('Notificación eliminada', 'success');
        }
      };

      // Funcionalidad de filtros
      const filterButtons = document.querySelectorAll('.filter-btn');
      filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          filterButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const filter = (btn as HTMLElement).getAttribute('data-filter');
          if (filter) {
            currentNotificationFilter = filter as 'all' | 'unread' | 'read';
            renderNotifications();
          }
        });
      });

      // Marcar todas como leídas
      const markAllReadBtn = document.getElementById('markAllReadBtn');
      if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', () => {
          const unreadNotifications = notifications.filter(n => n.unread);
          if (unreadNotifications.length === 0) {
            showMessage('No hay notificaciones sin leer', 'info');
            return;
          }
          
          notifications.forEach(n => n.unread = false);
          localStorage.setItem('notifications', JSON.stringify(notifications));
          renderNotifications();
          updateBadges();
          showMessage(`${unreadNotifications.length} notificación(es) marcada(s) como leída(s)`, 'success');
        });
      }

      // Eliminar todas las leídas
      const deleteAllReadBtn = document.getElementById('deleteAllReadBtn');
      if (deleteAllReadBtn) {
        deleteAllReadBtn.addEventListener('click', () => {
          const readNotifications = notifications.filter(n => !n.unread);
          if (readNotifications.length === 0) {
            showMessage('No hay notificaciones leídas para eliminar', 'info');
            return;
          }
          
          if (confirm(`¿Estás seguro de que quieres eliminar ${readNotifications.length} notificación(es) leída(s)?`)) {
            notifications = notifications.filter(n => n.unread);
            localStorage.setItem('notifications', JSON.stringify(notifications));
            renderNotifications();
            updateBadges();
            showMessage(`${readNotifications.length} notificación(es) eliminada(s)`, 'success');
          }
        });
      }

      const renderSettings = () => {
        const emailNotifications = document.getElementById('emailNotifications') as HTMLInputElement;
        const promotionNotifications = document.getElementById('promotionNotifications') as HTMLInputElement;
        const orderNotifications = document.getElementById('orderNotifications') as HTMLInputElement;
        const publicProfile = document.getElementById('publicProfile') as HTMLInputElement;
        const shareData = document.getElementById('shareData') as HTMLInputElement;
        const themeSelector = document.getElementById('themeSelector') as HTMLSelectElement;

        if (emailNotifications) emailNotifications.checked = userSettings.emailNotifications;
        if (promotionNotifications) promotionNotifications.checked = userSettings.promotionNotifications;
        if (orderNotifications) orderNotifications.checked = userSettings.orderNotifications;
        if (publicProfile) publicProfile.checked = userSettings.publicProfile;
        if (shareData) shareData.checked = userSettings.shareData;
        if (themeSelector) themeSelector.value = userSettings.theme;
      };

      const renderRecommendations = () => {
        const recommendationsGrid = document.querySelector('.recommendations-grid');
        if (!recommendationsGrid) return;

        // Datos de ejemplo para recomendaciones
        const exampleRecommendations = [
          {
            id: 201,
            name: 'Negra Modelo',
            style: 'Munich Dunkel',
            price: 26.00,
            points: 26,
            image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400',
            reason: '🔥 Basado en tus compras anteriores',
            badge: 'Popular'
          },
          {
            id: 202,
            name: 'Dos Equis Ámbar',
            style: 'Vienna Lager',
            price: 24.50,
            points: 24,
            image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400',
            reason: '⭐ Los clientes también compraron',
            badge: 'Trending'
          },
          {
            id: 203,
            name: 'Indio',
            style: 'Dark Lager',
            price: 21.00,
            points: 21,
            image: 'https://images.unsplash.com/photo-1618885472179-5e474019f2a9?w=400',
            reason: '✨ Nuevo para ti',
            badge: 'Nuevo'
          },
          {
            id: 204,
            name: 'Tecate Light',
            style: 'Light Lager',
            price: 20.00,
            points: 20,
            image: 'https://images.unsplash.com/photo-1612528443702-f6741f70a049?w=400',
            reason: '💎 Combina con tus favoritos',
            badge: 'Recomendado'
          }
        ];

        // Si hay datos del catálogo, úsalos, sino usa los de ejemplo
        let recommendations = exampleRecommendations;
        if (beerData.length > 0) {
          recommendations = [
            { ...beerData[0], image: normalizeImageUrl(beerData[0]?.image, beerData[0]?.name || 'Cerveza'), reason: '🔥 Basado en tus compras anteriores', badge: 'Popular' },
            { ...(beerData[1] || beerData[0]), image: normalizeImageUrl((beerData[1] || beerData[0])?.image, (beerData[1] || beerData[0])?.name || 'Cerveza'), reason: '⭐ Los clientes también compraron', badge: 'Trending' },
            { ...(beerData[3] || beerData[0]), image: normalizeImageUrl((beerData[3] || beerData[0])?.image, (beerData[3] || beerData[0])?.name || 'Cerveza'), reason: '✨ Nuevo para ti', badge: 'Nuevo' },
            { ...(beerData[2] || beerData[0]), image: normalizeImageUrl((beerData[2] || beerData[0])?.image, (beerData[2] || beerData[0])?.name || 'Cerveza'), reason: '💎 Combina con tus favoritos', badge: 'Recomendado' }
          ].filter(Boolean).map(beer => ({
            ...beer,
            image: normalizeImageUrl(beer.image, beer.name || 'Cerveza') // Normalizar una vez más por seguridad
          }));
        }

        recommendationsGrid.innerHTML = recommendations.map(beer => {
          // Asegurar que la imagen esté normalizada
          const normalizedImage = normalizeImageUrl(beer.image, beer.name || 'Cerveza');
          return `
          <div class="recommendation-card">
            <span class="recommendation-badge">${beer.badge}</span>
            <img src="${normalizedImage}" alt="${beer.name}" onerror="this.src='https://via.placeholder.com/280x200/EEE/333?text=Cerveza'">
            <h3>${beer.name}</h3>
            <p style="color: #7f8c8d; margin: 10px 0;">${beer.style}</p>
            <p style="color: #fdbb2d; font-size: 24px; font-weight: 700;">$${beer.price}</p>
            <div class="recommendation-reason">
              <i class="fas fa-magic"></i> ${beer.reason}
            </div>
            <button onclick="addToCart(${beer.id})" style="width: 100%; padding: 12px; background: #9b59b6; border: none; border-radius: 8px; color: white; font-weight: 700; cursor: pointer; margin-top: 15px;">
              <i class="fas fa-shopping-cart"></i> Agregar al Carrito
            </button>
          </div>
        `;
        }).join('');
      };

      // Guardar referencias a funciones de renderizado
      self.renderFavoritesFn = renderFavorites;
      self.renderAddressesFn = renderAddresses;
      self.renderNotificationsFn = renderNotifications;
      self.renderSettingsFn = renderSettings;
      self.renderRecommendationsFn = renderRecommendations;

      // Función para recargar datos de ejemplo (útil para desarrollo)
      (window as any).resetDatosEjemplo = () => {
        localStorage.removeItem('favorites');
        localStorage.removeItem('addresses');
        localStorage.removeItem('userSettings');
        alert('✓ Datos limpiados. Recarga la página (F5) para ver los datos de ejemplo.');
        console.log('💡 Tip: Recarga la página con F5');
      };

      // Funciones globales
      (window as any).toggleFavorite = (beerId: number) => {
        const beer = beerData.find((b: any) => b.id === beerId);
        if (!beer) return;

        const index = favorites.findIndex(f => f.id === beerId);
        if (index > -1) {
          favorites.splice(index, 1);
          showMessage('❤️ Eliminado de favoritos', 'info');
        } else {
          favorites.push(beer);
          showMessage('❤️ Agregado a favoritos', 'success');
        }
        saveFavorites();
        updateBadges();
        
        // Actualizar color del botón en el catálogo
        const buttons = document.querySelectorAll('.favorite-btn');
        buttons.forEach((btn: any) => {
          const onclick = btn.getAttribute('onclick');
          if (onclick && onclick.includes(`toggleFavorite(${beerId})`)) {
            if (index > -1) {
              btn.style.color = '#fff';
            } else {
              btn.style.color = '#e74c3c';
            }
          }
        });
      };

      (window as any).removeFavorite = (beerId: number) => {
        favorites = favorites.filter(f => f.id !== beerId);
        saveFavorites();
        renderFavorites();
        updateBadges();
        showMessage('❤️ Eliminado de favoritos', 'info');
      };

      (window as any).isFavorite = (beerId: number) => {
        return favorites.some(f => f.id === beerId);
      };

      (window as any).addAddress = () => {
        // Abrir modal para agregar dirección
        const modal = document.getElementById('addressModal');
        const form = document.getElementById('addressForm') as HTMLFormElement;
        const modalTitle = document.getElementById('addressModalTitle');
        
        if (modal && form && modalTitle) {
          // Resetear formulario
          form.reset();
          modalTitle.innerHTML = '<i class="fas fa-map-marker-alt"></i> Agregar Nueva Dirección';
          (form as any).dataset.mode = 'add';
          
          // Mostrar modal
          modal.style.display = 'flex';
          
          // Manejar etiqueta personalizada
          const labelSelect = document.getElementById('addressLabel') as HTMLSelectElement;
          const labelCustom = document.getElementById('addressLabelCustom') as HTMLInputElement;
          
          if (labelSelect && labelCustom) {
            labelSelect.addEventListener('change', () => {
              if (labelSelect.value === 'Otro') {
                labelCustom.style.display = 'block';
                labelCustom.required = true;
              } else {
                labelCustom.style.display = 'none';
                labelCustom.required = false;
              }
            });
          }
        }
      };

      (window as any).setDefaultAddress = (index: number) => {
        addresses.forEach((addr, i) => {
          addr.default = i === index;
        });
        saveAddresses();
        renderAddresses();
        showMessage('Dirección predeterminada actualizada', 'success');
      };

      (window as any).editAddress = (index: number) => {
        const addr = addresses[index];
        const modal = document.getElementById('addressModal');
        const form = document.getElementById('addressForm') as HTMLFormElement;
        const modalTitle = document.getElementById('addressModalTitle');
        
        if (modal && form && modalTitle) {
          // Llenar formulario con datos existentes
          const labelSelect = document.getElementById('addressLabel') as HTMLSelectElement;
          const labelCustom = document.getElementById('addressLabelCustom') as HTMLInputElement;
          const streetInput = document.getElementById('addressStreet') as HTMLInputElement;
          const cityInput = document.getElementById('addressCity') as HTMLInputElement;
          const stateInput = document.getElementById('addressState') as HTMLInputElement;
          const zipCodeInput = document.getElementById('addressZipCode') as HTMLInputElement;
          const phoneInput = document.getElementById('addressPhone') as HTMLInputElement;
          const referenceInput = document.getElementById('addressReference') as HTMLTextAreaElement;
          const defaultCheckbox = document.getElementById('addressDefault') as HTMLInputElement;
          
          if (labelSelect && labelCustom) {
            if (['Casa', 'Oficina'].includes(addr.label)) {
              labelSelect.value = addr.label;
              labelCustom.style.display = 'none';
            } else {
              labelSelect.value = 'Otro';
              labelCustom.value = addr.label;
              labelCustom.style.display = 'block';
            }
          }
          
          if (streetInput) streetInput.value = addr.street || '';
          if (cityInput) cityInput.value = addr.city || '';
          if (stateInput) stateInput.value = addr.state || '';
          if (zipCodeInput) zipCodeInput.value = addr.zipCode || '';
          if (phoneInput) phoneInput.value = addr.phone || '';
          if (referenceInput) referenceInput.value = addr.reference || '';
          if (defaultCheckbox) defaultCheckbox.checked = addr.default || false;
          
          modalTitle.innerHTML = '<i class="fas fa-edit"></i> Editar Dirección';
          (form as any).dataset.mode = 'edit';
          (form as any).dataset.index = index.toString();
          
          // Mostrar modal
          modal.style.display = 'flex';
        }
      };

      (window as any).deleteAddress = (index: number) => {
        if (confirm('¿Estás seguro de eliminar esta dirección?')) {
          addresses.splice(index, 1);
          saveAddresses();
          renderAddresses();
          showMessage('Dirección eliminada', 'info');
        }
      };

      (window as any).markAsRead = (notifId: number) => {
        const notif = notifications.find(n => n.id === notifId);
        if (notif) {
          notif.unread = false;
          renderNotifications();
          updateBadges();
          showMessage('✓ Notificación marcada como leída', 'success');
        }
      };

      // Event Listeners

      // Favoritos
      const showFavoritesBtn = document.getElementById('showFavorites');
      if (showFavoritesBtn) {
        showFavoritesBtn.addEventListener('click', () => {
          renderFavorites();
          showView(views.favorites);
        });
      }

      // Botón de regreso desde favoritos
      const backToDashboardFromFavorites = document.getElementById('backToDashboardFromFavorites');
      if (backToDashboardFromFavorites) {
        backToDashboardFromFavorites.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (showView && views.dashboard) {
            showView(views.dashboard);
          } else if (self.showViewFn && self.views) {
            self.showViewFn(self.views.dashboard);
          } else {
            const favoritesView = document.getElementById('favoritesView');
            const dashboardView = document.getElementById('dashboardView');
            if (favoritesView) favoritesView.style.display = 'none';
            if (dashboardView) dashboardView.style.display = 'block';
          }
        });
      }

      // Historial de Puntos
      const showPointsHistoryBtn = document.getElementById('showPointsHistory');
      if (showPointsHistoryBtn) {
        showPointsHistoryBtn.addEventListener('click', () => {
          if (self.currentUser) {
            const now = Date.now();
            if (self.pointsHistoryCache && (now - self.pointsHistoryCacheTimestamp) < self.cacheTimeout) {
              // Usar datos de la caché
              console.log('Cargando historial de puntos desde caché.');
              self.renderPointsHistory(self.pointsHistoryCache);
            } else {
              // Hacer petición y actualizar caché
              self.databaseService.getTransaccionesPuntos(self.currentUser.id!).subscribe({
                next: (transacciones: any[]) => {
                  self.pointsHistoryCache = transacciones;
                  self.pointsHistoryCacheTimestamp = now;
                  console.log('Historial de puntos cargado y cacheado.');
                  self.renderPointsHistory(transacciones);
                },
                error: (err) => {
                  console.error('Error al obtener historial de puntos:', err);
                  showMessage('Error al cargar historial de puntos.', 'error');
                }
              });
            }
          }
        });
      }

      // Mis Direcciones
      const showAddressesBtn = document.getElementById('showAddresses');
      if (showAddressesBtn) {
        showAddressesBtn.addEventListener('click', () => {
          renderAddresses();
          showView(views.addresses);
        });
      }

      // Botón de regreso desde direcciones
      const backToDashboardFromAddresses = document.getElementById('backToDashboardFromAddresses');
      if (backToDashboardFromAddresses) {
        backToDashboardFromAddresses.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (showView && views.dashboard) {
            showView(views.dashboard);
          } else if (self.showViewFn && self.views) {
            self.showViewFn(self.views.dashboard);
          } else {
            const addressesView = document.getElementById('addressesView');
            const dashboardView = document.getElementById('dashboardView');
            if (addressesView) addressesView.style.display = 'none';
            if (dashboardView) dashboardView.style.display = 'block';
          }
        });
      }

      // Botón agregar dirección
      const addAddressBtn = document.getElementById('addAddressBtn');
      if (addAddressBtn) {
        addAddressBtn.addEventListener('click', () => (window as any).addAddress());
      }
      
      // Manejar formulario de dirección
      const addressForm = document.getElementById('addressForm') as HTMLFormElement;
      if (addressForm) {
        addressForm.addEventListener('submit', (e) => {
          e.preventDefault();
          
          const form = e.target as HTMLFormElement;
          const mode = (form as any).dataset.mode; // 'add' o 'edit'
          const index = (form as any).dataset.index ? parseInt((form as any).dataset.index) : null;
          
          // Obtener valores del formulario
          const labelSelect = document.getElementById('addressLabel') as HTMLSelectElement;
          const labelCustom = document.getElementById('addressLabelCustom') as HTMLInputElement;
          const street = (document.getElementById('addressStreet') as HTMLInputElement).value.trim();
          const city = (document.getElementById('addressCity') as HTMLInputElement).value.trim();
          const state = (document.getElementById('addressState') as HTMLInputElement).value.trim();
          const zipCode = (document.getElementById('addressZipCode') as HTMLInputElement).value.trim();
          const phone = (document.getElementById('addressPhone') as HTMLInputElement).value.trim();
          const reference = (document.getElementById('addressReference') as HTMLTextAreaElement).value.trim();
          const isDefault = (document.getElementById('addressDefault') as HTMLInputElement).checked;
          
          // Validar campos requeridos
          if (!street || !city || !state || !zipCode) {
            showMessage('Por favor completa todos los campos requeridos', 'error');
            return;
          }
          
          // Validar código postal (5 dígitos)
          if (!/^\d{5}$/.test(zipCode)) {
            showMessage('El código postal debe tener 5 dígitos', 'error');
            return;
          }
          
          // Obtener etiqueta
          let label = '';
          if (labelSelect && labelSelect.value === 'Otro' && labelCustom) {
            label = labelCustom.value.trim();
            if (!label) {
              showMessage('Por favor ingresa una etiqueta personalizada', 'error');
              return;
            }
          } else if (labelSelect) {
            label = labelSelect.value;
          }
          
          // Crear objeto de dirección
          const newAddress: any = {
            label,
            street,
            city,
            state,
            zipCode,
            phone,
            reference,
            default: isDefault || addresses.length === 0
          };
          
          if (mode === 'edit' && index !== null) {
            // Editar dirección existente
            addresses[index] = newAddress;
            showMessage('Dirección actualizada correctamente', 'success');
          } else {
            // Agregar nueva dirección
            addresses.push(newAddress);
            showMessage('Dirección agregada correctamente', 'success');
          }
          
          // Si se marcó como predeterminada, desmarcar las demás
          if (newAddress.default) {
            addresses.forEach((addr, i) => {
              if (mode === 'edit' && i === index) return;
              addr.default = false;
            });
            const targetIndex = mode === 'edit' && index !== null ? index : addresses.length - 1;
            if (addresses[targetIndex]) {
              addresses[targetIndex].default = true;
            }
          }
          
          saveAddresses();
          renderAddresses();
          
          // Cerrar modal
          const modal = document.getElementById('addressModal');
          if (modal) {
            modal.style.display = 'none';
          }
        });
      }
      
      // Cerrar modal de dirección
      const closeAddressModal = document.getElementById('closeAddressModal');
      const cancelAddressForm = document.getElementById('cancelAddressForm');
      
      const closeModal = () => {
        const modal = document.getElementById('addressModal');
        if (modal) {
          modal.style.display = 'none';
          const form = document.getElementById('addressForm') as HTMLFormElement;
          if (form) form.reset();
        }
      };
      
      if (closeAddressModal) {
        closeAddressModal.addEventListener('click', closeModal);
      }
      
      if (cancelAddressForm) {
        cancelAddressForm.addEventListener('click', closeModal);
      }
      
      // Cerrar modal al hacer clic fuera
      const addressModal = document.getElementById('addressModal');
      if (addressModal) {
        addressModal.addEventListener('click', (e) => {
          if (e.target === addressModal) {
            closeModal();
          }
        });
      }
      
      // Manejar cambio de etiqueta
      const addressLabelSelect = document.getElementById('addressLabel');
      const addressLabelCustom = document.getElementById('addressLabelCustom');
      if (addressLabelSelect && addressLabelCustom) {
        addressLabelSelect.addEventListener('change', () => {
          if ((addressLabelSelect as HTMLSelectElement).value === 'Otro') {
            addressLabelCustom.style.display = 'block';
            (addressLabelCustom as HTMLInputElement).required = true;
          } else {
            addressLabelCustom.style.display = 'none';
            (addressLabelCustom as HTMLInputElement).required = false;
            (addressLabelCustom as HTMLInputElement).value = '';
          }
        });
      }

      // Notificaciones
      const showNotificationsBtn = document.getElementById('showNotifications');
      if (showNotificationsBtn) {
        showNotificationsBtn.addEventListener('click', () => {
          // Cargar notificaciones desde localStorage
          const savedNotifications = localStorage.getItem('notifications');
          if (savedNotifications) {
            try {
              notifications = JSON.parse(savedNotifications);
            } catch (e) {
              console.error('Error al cargar notificaciones:', e);
            }
          }
          // Guardar notificaciones en localStorage si no existen
          if (notifications.length > 0) {
            localStorage.setItem('notifications', JSON.stringify(notifications));
          }
          renderNotifications();
          showView(views.notifications);
        });
      }
      
      // Cargar notificaciones al inicializar
      const savedNotifications = localStorage.getItem('notifications');
      if (savedNotifications) {
        try {
          const loaded = JSON.parse(savedNotifications);
          if (Array.isArray(loaded) && loaded.length > 0) {
            notifications = loaded;
          }
        } catch (e) {
          console.error('Error al cargar notificaciones:', e);
        }
      }

      // Botón de regreso desde notificaciones
      const backToDashboardFromNotifications = document.getElementById('backToDashboardFromNotifications');
      if (backToDashboardFromNotifications) {
        backToDashboardFromNotifications.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (showView && views.dashboard) {
            showView(views.dashboard);
          } else if (self.showViewFn && self.views) {
            self.showViewFn(self.views.dashboard);
          } else {
            const notificationsView = document.getElementById('notificationsView');
            const dashboardView = document.getElementById('dashboardView');
            if (notificationsView) notificationsView.style.display = 'none';
            if (dashboardView) dashboardView.style.display = 'block';
          }
        });
      }

      // Ayuda y Soporte
      const showHelpBtn = document.getElementById('showHelp');
      if (showHelpBtn) {
        // Remover listeners anteriores para evitar duplicados
        const newHelpBtn = showHelpBtn.cloneNode(true);
        showHelpBtn.parentNode?.replaceChild(newHelpBtn, showHelpBtn);
        
        newHelpBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          // Cerrar todos los modales primero para evitar conflictos
          closeAllModals();
          
          const helpHtml = `
            <div style="padding: 30px; max-width: 700px; margin: 0 auto; text-align: left;">
              <h2 style="color: #fdbb2d; margin-bottom: 25px;">
                <i class="fas fa-question-circle"></i> Ayuda y Soporte
              </h2>
              <div style="margin-bottom: 20px;">
                <h3 style="color: #3498db; margin-bottom: 10px;">
                  <i class="fas fa-phone"></i> Contacto
                </h3>
                <p>📞 Teléfono: +52 123 456 7890</p>
                <p>📧 Email: soporte@cervezapremium.com</p>
                <p>💬 WhatsApp: +52 123 456 7890</p>
              </div>
              <div style="margin-bottom: 20px;">
                <h3 style="color: #3498db; margin-bottom: 10px;">
                  <i class="fas fa-clock"></i> Horarios
                </h3>
                <p>Lunes a Viernes: 9:00 AM - 8:00 PM</p>
                <p>Sábados: 10:00 AM - 6:00 PM</p>
                <p>Domingos: 10:00 AM - 4:00 PM</p>
              </div>
              <div>
                <h3 style="color: #3498db; margin-bottom: 10px;">
                  <i class="fas fa-question"></i> Preguntas Frecuentes
                </h3>
                <p><strong>¿Cómo funciona el sistema de puntos?</strong><br>
                Ganas 10 puntos por cada $100 gastados. Úsalos para obtener descuentos.</p>
                <p><strong>¿Cuál es el tiempo de entrega?</strong><br>
                De 24 a 48 horas en la ciudad, 3-5 días en otras áreas.</p>
                <p><strong>¿Puedo cancelar mi pedido?</strong><br>
                Sí, dentro de las primeras 2 horas después de realizado.</p>
              </div>
            </div>
          `;
          
          // Mostrar el mensaje sin auto-cierre (false) ya que es contenido largo
          setTimeout(() => {
            showMessage(helpHtml, 'info', false);
          }, 150);
        });
      }

      // Configuración
      const showSettingsBtn = document.getElementById('showSettings');
      if (showSettingsBtn) {
        showSettingsBtn.addEventListener('click', () => {
          renderSettings();
          showView(views.settings);
        });
      }

      // Botón de regreso desde configuración
      const backToDashboardFromSettings = document.getElementById('backToDashboardFromSettings');
      if (backToDashboardFromSettings) {
        backToDashboardFromSettings.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (showView && views.dashboard) {
            showView(views.dashboard);
          } else if (self.showViewFn && self.views) {
            self.showViewFn(self.views.dashboard);
          } else {
            const settingsView = document.getElementById('settingsView');
            const dashboardView = document.getElementById('dashboardView');
            if (settingsView) settingsView.style.display = 'none';
            if (dashboardView) dashboardView.style.display = 'block';
          }
        });
      }

      // Botón guardar configuración
      const saveSettingsBtn = document.getElementById('saveSettingsBtn');
      if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', () => {
          const emailNotifications = document.getElementById('emailNotifications') as HTMLInputElement;
          const promotionNotifications = document.getElementById('promotionNotifications') as HTMLInputElement;
          const orderNotifications = document.getElementById('orderNotifications') as HTMLInputElement;
          const publicProfile = document.getElementById('publicProfile') as HTMLInputElement;
          const shareData = document.getElementById('shareData') as HTMLInputElement;
          const themeSelector = document.getElementById('themeSelector') as HTMLSelectElement;

          userSettings = {
            emailNotifications: emailNotifications?.checked || false,
            promotionNotifications: promotionNotifications?.checked || false,
            orderNotifications: orderNotifications?.checked || false,
            publicProfile: publicProfile?.checked || false,
            shareData: shareData?.checked || false,
            theme: themeSelector?.value || 'dark'
          };

          saveSettings();
          showMessage('Configuración guardada correctamente', 'success');
        });
      }

      // Promociones
      const showPromotionsBtn = document.getElementById('showPromotions');
      if (showPromotionsBtn) {
        showPromotionsBtn.addEventListener('click', () => {
          const promoHtml = `
            <div style="padding: 30px; max-width: 800px; margin: 0 auto;">
              <h2 style="color: #fdbb2d; margin-bottom: 25px;">
                <i class="fas fa-gift"></i> Promociones Activas
              </h2>
              <div style="background: linear-gradient(145deg, #232b38, #1a1a1a); padding: 25px; border-radius: 15px; margin-bottom: 20px; border: 2px solid #e91e63;">
                <h3 style="color: #e91e63; margin-bottom: 10px;">🎉 BIENVENIDA15</h3>
                <p style="font-size: 18px; margin-bottom: 10px;">15% de descuento en tu primera compra</p>
                <p style="opacity: 0.8;">Válido hasta fin de mes</p>
              </div>
              <div style="background: linear-gradient(145deg, #232b38, #1a1a1a); padding: 25px; border-radius: 15px; margin-bottom: 20px; border: 2px solid #f39c12;">
                <h3 style="color: #f39c12; margin-bottom: 10px;">⭐ PUNTOS2X</h3>
                <p style="font-size: 18px; margin-bottom: 10px;">Gana el doble de puntos en compras mayores a $500</p>
                <p style="opacity: 0.8;">Válido los fines de semana</p>
              </div>
              <div style="background: linear-gradient(145deg, #232b38, #1a1a1a); padding: 25px; border-radius: 15px; border: 2px solid #27ae60;">
                <h3 style="color: #27ae60; margin-bottom: 10px;">🚚 ENVIOGRATIS</h3>
                <p style="font-size: 18px; margin-bottom: 10px;">Envío gratuito en compras mayores a $300</p>
                <p style="opacity: 0.8;">Siempre activo</p>
              </div>
            </div>
          `;
          showMessage(promoHtml, 'info');
        });
      }

      // Recomendaciones
      const showRecommendationsBtn = document.getElementById('showRecommendations');
      if (showRecommendationsBtn) {
        showRecommendationsBtn.addEventListener('click', () => {
          renderRecommendations();
          showView(views.recommendations);
        });
      }

      // Botón de regreso desde recomendaciones
      const backToDashboardFromRecommendations = document.getElementById('backToDashboardFromRecommendations');
      if (backToDashboardFromRecommendations) {
        backToDashboardFromRecommendations.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (showView && views.dashboard) {
            showView(views.dashboard);
          } else if (self.showViewFn && self.views) {
            self.showViewFn(self.views.dashboard);
          } else {
            const recommendationsView = document.getElementById('recommendationsView');
            const dashboardView = document.getElementById('dashboardView');
            if (recommendationsView) recommendationsView.style.display = 'none';
            if (dashboardView) dashboardView.style.display = 'block';
          }
        });
      }
      
      navButtons.logout?.addEventListener('click', () => {
        // Limpiar datos de sesión
        cart = [];
        appliedDiscount = 0;
        pointsUsed = 0;
        updateCartBadges();
        showView(views.login);
        showMessage('Sesión cerrada correctamente.', 'info');
      });
      
      // Función helper para volver al dashboard
      const goToDashboard = (e?: Event) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        
        console.log('🔄 Intentando volver al dashboard...');
        
        // Intentar usar showView si está disponible
        if (showView && views.dashboard) {
          console.log('✅ Usando showView con views.dashboard');
          showView(views.dashboard);
          return;
        }
        
        // Intentar usar showViewFn si está disponible
        if (self.showViewFn && self.views && self.views.dashboard) {
          console.log('✅ Usando showViewFn con self.views.dashboard');
          self.showViewFn(self.views.dashboard);
          return;
        }
        
        // Fallback: manipulación directa del DOM
        console.log('⚠️ Usando fallback: manipulación directa del DOM');
          const dashboardView = document.getElementById('dashboardView');
        if (!dashboardView) {
          console.error('❌ dashboardView no encontrado');
          return;
        }
        
        // Ocultar todas las vistas
        document.querySelectorAll('.view').forEach((v: any) => {
          if (v && v.classList) {
            v.classList.remove('active');
            v.style.display = 'none';
          }
        });
        
        // Mostrar dashboard
                dashboardView.classList.add('active');
                dashboardView.style.display = 'block';
        
        // Scroll al inicio
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
        
        console.log('✅ Dashboard mostrado');
      };
      
      // Botones de regreso
      navButtons.backToDashboard?.addEventListener('click', goToDashboard);
      navButtons.backToDashboardFromProfile?.addEventListener('click', goToDashboard);
      navButtons.backToDashboardFromOrders?.addEventListener('click', goToDashboard);
      navButtons.backToDashboardFromCart?.addEventListener('click', goToDashboard);
      
      // Función helper para agregar listeners de respaldo a botones "Volver"
      const addBackButtonFallback = (buttonId: string) => {
        setTimeout(() => {
          const btn = document.getElementById(buttonId);
          if (btn) {
            // Remover listeners anteriores si existen
            const newBtn = btn.cloneNode(true);
            btn.parentNode?.replaceChild(newBtn, btn);
            
            // Agregar nuevo listener
            newBtn.addEventListener('click', goToDashboard, true);
            console.log(`✅ Listener agregado a ${buttonId}`);
          } else {
            console.warn(`⚠️ Botón ${buttonId} no encontrado`);
          }
        }, 200);
      };

      // Agregar listeners de respaldo para todos los botones "Volver"
      addBackButtonFallback('backToDashboardFromProfile');
      addBackButtonFallback('backToDashboardFromNotifications');
      addBackButtonFallback('backToDashboardFromCart');
      addBackButtonFallback('backToDashboardFromOrders');
      addBackButtonFallback('backToDashboardFromFavorites');
      addBackButtonFallback('backToDashboardFromAddresses');
      addBackButtonFallback('backToDashboardFromSettings');
      addBackButtonFallback('backToDashboardFromRecommendations');
      navButtons.goToCart?.addEventListener('click', () => {
        renderCart();
        showView(views.cart);
      });
      navButtons.continueShopping?.addEventListener('click', () => {
        generateBeerCatalog();
        showView(views.catalog);
      });
      
      // Cerrar mensaje
      navButtons.closeMessage?.addEventListener('click', () => {
        closeAllModals(); // Usar la función centralizada
      });
      
      // Perfil - Actualizar para usar el nuevo ID del formulario
      const profileForm = document.getElementById('profileForm');
      if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
          e.preventDefault();
          
          if (!self.currentUser) return;
          
          const formData = new FormData(e.target as HTMLFormElement);
          const profileData: Partial<Usuario> = {
            nombre_completo: formData.get('name') as string,
            telefono: formData.get('phone') as string,
            direccion: formData.get('address') as string,
            fecha_nacimiento: formData.get('birthDate') as string
          };
          
          self.databaseService.updateProfile(self.currentUser.id!, profileData).subscribe({
            next: () => {
              showMessage('Perfil actualizado con éxito.', 'success');
              // Actualizar datos del usuario actual manteniendo el tipo Usuario
              self.currentUser = { ...(self.currentUser as Usuario), ...profileData } as Usuario;
              
              // Actualizar información del header
              const profileDisplayName = document.getElementById('profileDisplayName');
              const avatarInitials = document.getElementById('avatarInitials');
              
              if (profileDisplayName) profileDisplayName.textContent = profileData.nombre_completo || 'Usuario';
              if (avatarInitials) {
                const initials = (profileData.nombre_completo || 'U').charAt(0) + 
                                (profileData.nombre_completo?.split(' ')[1]?.charAt(0) || '');
                avatarInitials.textContent = initials;
              }
            },
            error: (err: any) => {
              const msg = err?.error?.error || 'Error al actualizar el perfil';
              showMessage(msg, 'error');
            }
          });
        });
      }
      
      // Mantener compatibilidad con el formulario anterior si existe
      if (forms.profile) {
        forms.profile.addEventListener('submit', function(e) {
          e.preventDefault();
          
          if (!self.currentUser) return;
          
          const formData = new FormData(e.target as HTMLFormElement);
          const profileData: Partial<Usuario> = {
            nombre_completo: formData.get('name') as string,
            telefono: formData.get('phone') as string,
            direccion: formData.get('address') as string,
            fecha_nacimiento: formData.get('birthDate') as string
          };
          
          self.databaseService.updateProfile(self.currentUser.id!, profileData).subscribe({
            next: () => {
              showMessage('Perfil actualizado con éxito.', 'success');
              self.currentUser = { ...(self.currentUser as Usuario), ...profileData } as Usuario;
            },
            error: (err: any) => {
              const msg = err?.error?.error || 'Error al actualizar el perfil';
              showMessage(msg, 'error');
            }
          });
        });
      }
      
      // Funciones del carrito - hacerlas globales
      (window as any).addToCart = addToCart;
      (window as any).removeFromCart = removeFromCart;
      (window as any).updateQuantity = updateQuantity;
      (window as any).filterBeers = filterBeers;
      (window as any).clearAllFilters = clearAllFilters;
      (window as any).clearSearch = clearSearch;
      (window as any).applyPointsDiscount = applyPointsDiscount;

      // ========== FUNCIONES DE RESET PASSWORD ==========

      // Función para mostrar formulario de forgot password
      (window as any).showForgotPasswordForm = () => {
        showView(views.forgotPassword);
      };

      // Función para mostrar formulario de login
      (window as any).showLoginForm = () => {
        showView(views.login);
      };

      // Función para toggle de contraseña
      (window as any).togglePassword = (inputId: string, iconId: string) => {
        const input = document.getElementById(inputId) as HTMLInputElement;
        const icon = document.getElementById(iconId);
        
        if (input && icon) {
          if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
          } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
          }
        }
      };

      // Manejar formulario de forgot password
      document.getElementById('forgotPasswordForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const currentTarget = e.currentTarget as HTMLElement | null;
        const email = (document.getElementById('forgotEmail') as HTMLInputElement).value;
        const button = currentTarget ? (currentTarget.querySelector('.login-button') as HTMLButtonElement) : null;
        if (!button) return;
        const buttonText = button.querySelector('.button-text') as HTMLElement;
        const spinner = button.querySelector('.loading-spinner') as HTMLElement;
        
        if (!email) {
          showMessage('Por favor ingresa tu email', 'error');
          return;
        }

        // Mostrar loading
        buttonText.style.display = 'none';
        spinner.style.display = 'inline-block';
        button.disabled = true;

        console.log('📧 Enviando solicitud de reset para:', email);

        self.databaseService.forgotPassword(email).subscribe({
          next: (response: any) => {
            console.log('✅ Respuesta del servidor:', response);
            showMessage(response.message, 'success');
            
            if (response.resetUrl) {
              console.log('\n=== 🔗 URL DE RESET DE CONTRASEÑA ===');
              console.log('Email:', email);
              console.log('URL:', response.resetUrl);
              console.log('=====================================\n');
              // Mostrar también en un alert para facilitar copiar la URL
              alert(`✅ URL de reset generada:\n\n${response.resetUrl}\n\n(Copia esta URL y ábrela en el navegador para restablecer tu contraseña)`);
            } else {
              // Si no hay resetUrl, significa que el email no existe o el usuario está inactivo
              console.log('⚠️ No se recibió resetUrl');
              console.log('Esto significa que:');
              console.log('1. El email no está registrado en el sistema');
              console.log('2. O el usuario está inactivo');
              console.log('\n💡 Solución: Regístrate primero o verifica que el email sea correcto');
              showMessage('El email no está registrado en nuestro sistema. Por favor, regístrate primero o verifica que el email sea correcto.', 'info');
            }
            
            // Limpiar formulario
            const forgotEmailInput = document.getElementById('forgotEmail') as HTMLInputElement;
            if (forgotEmailInput) forgotEmailInput.value = '';
            showView(views.login);
          },
          error: (err: any) => {
            console.error('❌ Error completo:', err);
            console.error('❌ Error status:', err?.status);
            console.error('❌ Error message:', err?.message);
            console.error('❌ Error response:', err?.error);
            
            let msg = 'Error al enviar el enlace';
            if (err?.error?.error) {
              msg = err.error.error;
            } else if (err?.status === 0) {
              msg = 'No se pudo conectar al servidor. Verifica que el backend esté corriendo en http://localhost:4000';
            } else if (err?.status === 400) {
              msg = 'Email inválido o faltante';
            } else if (err?.status === 500) {
              msg = 'Error interno del servidor. Revisa la consola del backend';
            }
            
            showMessage(msg, 'error');
            alert(`❌ Error: ${msg}\n\nRevisa la consola del navegador (F12) para más detalles.`);
          },
          complete: () => {
            console.log('✅ Petición completada');
            // Restaurar botón
            buttonText.style.display = 'inline';
            spinner.style.display = 'none';
            button.disabled = false;
          }
        });
      });

      // Manejar formulario de reset password
      document.getElementById('resetPasswordForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const currentTarget = e.currentTarget as HTMLElement | null;
        
        const newPassword = (document.getElementById('resetNewPassword') as HTMLInputElement)?.value;
        const confirmPassword = (document.getElementById('resetConfirmNewPassword') as HTMLInputElement)?.value;
        const button = currentTarget ? (currentTarget.querySelector('.login-button') as HTMLButtonElement) : null;
        if (!button) return;
        const buttonText = button.querySelector('.button-text') as HTMLElement;
        const spinner = button.querySelector('.loading-spinner') as HTMLElement;

        if (!newPassword || !confirmPassword) {
          showMessage('Por favor completa todos los campos', 'error');
          return;
        }

        if (newPassword !== confirmPassword) {
          showMessage('Las contraseñas no coinciden', 'error');
          return;
        }

        if (newPassword.length < 8) {
          showMessage('La contraseña debe tener al menos 8 caracteres', 'error');
          return;
        }

        // Obtener token de la URL
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        if (!token) {
          showMessage('Token de reset no válido', 'error');
          return;
        }

        // Mostrar loading
        buttonText.style.display = 'none';
        spinner.style.display = 'inline-block';
        button.disabled = true;

        self.databaseService.resetPassword(token, newPassword).subscribe({
          next: (response: any) => {
            showMessage(response.message, 'success');
            // Limpiar formulario y URL
            const newPasswordInput = document.getElementById('resetNewPassword') as HTMLInputElement;
            const confirmPasswordInput = document.getElementById('resetConfirmNewPassword') as HTMLInputElement;
            if (newPasswordInput) newPasswordInput.value = '';
            if (confirmPasswordInput) confirmPasswordInput.value = '';
            window.history.replaceState({}, document.title, window.location.pathname);
            showView(views.login);
          },
          error: (err: any) => {
            const msg = err?.error?.error || 'Error al restablecer la contraseña';
            showMessage(msg, 'error');
          },
          complete: () => {
            // Restaurar botón
            buttonText.style.display = 'inline';
            spinner.style.display = 'none';
            button.disabled = false;
          }
        });
      });

      // Verificar si hay token en la URL al cargar la página
      const urlParams = new URLSearchParams(window.location.search);
      const resetToken = urlParams.get('token');
      if (resetToken) {
        showView(views.resetPassword);
      }

      // ========== FUNCIONES DE ADMINISTRACIÓN ==========

      // Función para mostrar login de admin
      (window as any).showAdminLogin = () => {
        showView(views.adminLogin);
      };

      // Función para logout de admin
      (window as any).logoutAdmin = () => {
        self.databaseService.logout();
        self.currentUser = null;
        self.adminStats = null;
        showView(views.login);
        showMessage('Sesión de administrador cerrada', 'info');
      };

      // Función para mostrar sección del admin
      (window as any).showAdminSection = (section: string) => {
        console.log('🔄 Cambiando a sección:', section);
        
        // Ocultar todas las secciones
        document.querySelectorAll('.admin-section').forEach(sec => {
          sec.classList.remove('active');
          (sec as HTMLElement).style.display = 'none';
        });
        
        // Remover active de todas las tarjetas de navegación
        document.querySelectorAll('.admin-nav-card').forEach(card => {
          card.classList.remove('active');
        });

        // Mostrar la sección seleccionada
        // Convertir 'corte-diario' a 'CorteDiario' correctamente
        const sectionCamelCase = section.split('-').map((word, index) => 
          index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word.charAt(0).toUpperCase() + word.slice(1)
        ).join('');
        const sectionId = `admin${sectionCamelCase}Section`;
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
          targetSection.classList.add('active');
          (targetSection as HTMLElement).style.display = 'block';
          console.log('✅ Sección mostrada:', sectionId);
        } else {
          console.error('❌ Sección no encontrada:', sectionId);
        }

        // Activar la tarjeta de navegación correspondiente
        const targetCard = document.querySelector(`[onclick*="showAdminSection('${section}')"]`) as HTMLElement;
        if (targetCard) {
          targetCard.classList.add('active');
          console.log('✅ Tarjeta activada para:', section);
        } else {
          // Buscar por texto alternativo
          const allCards = document.querySelectorAll('.admin-nav-card');
          allCards.forEach(card => {
            const content = card.textContent?.toLowerCase() || '';
            if (content.includes(section.toLowerCase())) {
              card.classList.add('active');
              console.log('✅ Tarjeta activada por contenido:', section);
            }
          });
        }

        // Cargar datos según la sección
        switch(section) {
          case 'dashboard':
            if (typeof loadAdminStats === 'function') {
            loadAdminStats();
            } else {
              console.warn('⚠️ loadAdminStats no está definida');
            }
            break;
          case 'cervezas':
            if (typeof loadAdminCervezas === 'function') {
            loadAdminCervezas();
            } else {
              console.warn('⚠️ loadAdminCervezas no está definida');
            }
            break;
          case 'pedidos':
            if (typeof loadAdminPedidos === 'function') {
            loadAdminPedidos();
            } else {
              console.warn('⚠️ loadAdminPedidos no está definida');
            }
            break;
          case 'usuarios':
            if (self.currentUser?.rol === 'admin') {
              if (typeof loadAdminUsuarios === 'function') {
              loadAdminUsuarios();
              } else {
                console.warn('⚠️ loadAdminUsuarios no está definida');
              }
            }
            break;
          case 'reportes':
            if (typeof (window as any).cargarReportes === 'function') {
            (window as any).cargarReportes();
            } else {
              console.warn('⚠️ cargarReportes no está definida');
            }
            break;
          case 'notificaciones':
            if (typeof loadNotificaciones === 'function') {
            loadNotificaciones();
            } else {
              console.warn('⚠️ loadNotificaciones no está definida');
            }
            break;
          case 'descuentos':
            if (typeof loadDescuentos === 'function') {
            loadDescuentos();
            } else {
              console.warn('⚠️ loadDescuentos no está definida');
            }
            break;
          case 'domicilio':
            if (typeof loadDeliverySettings === 'function') {
            loadDeliverySettings();
            } else {
              console.warn('⚠️ loadDeliverySettings no está definida');
            }
            break;
          case 'corte-diario':
            if (typeof loadCorteDiario === 'function') {
            loadCorteDiario();
            } else {
              console.warn('⚠️ loadCorteDiario no está definida');
            }
            break;
          case 'repartidores':
            if (typeof loadRepartidoresRutas === 'function') {
              loadRepartidoresRutas();
            } else {
              console.warn('⚠️ loadRepartidoresRutas no está definida');
            }
            break;
          default:
            console.warn('⚠️ Sección desconocida:', section);
        }
      };

      // Cargar estadísticas del admin
      function loadAdminStats() {
        self.databaseService.getAdminStats().subscribe({
          next: (stats: any) => {
            self.adminStats = stats;
            // Los datos se actualizan automáticamente por Angular binding
          },
          error: (err: any) => {
            console.error('Error al cargar estadísticas:', err);
            showMessage('Error al cargar estadísticas', 'error');
          }
        });
      }

      // Cargar cervezas para admin
      function loadAdminCervezas() {
        self.databaseService.getAdminCervezas().subscribe({
          next: (cervezas: any[]) => {
            const tbody = document.getElementById('beersTableBody');
            if (tbody) {
              tbody.innerHTML = cervezas.map((cerveza: any) => `
                <tr>
                  <td>
                    <img src="${normalizeImageUrl(cerveza.imagen_url, cerveza.nombre || 'Cerveza', '50x50')}" 
                         alt="${cerveza.nombre}" 
                         style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">
                  </td>
                  <td>${cerveza.nombre}</td>
                  <td>${cerveza.estilo}</td>
                  <td>$${Number(cerveza.precio).toFixed(2)}</td>
                  <td>${cerveza.stock_disponible}</td>
                  <td>
                    <span class="status-badge ${cerveza.activa ? 'active' : 'inactive'}">
                      ${cerveza.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td>
                    <button class="btn-small" onclick="editCerveza(${cerveza.id})" title="Editar">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-small btn-info" onclick="manageStock(${cerveza.id}, '${cerveza.nombre}', '${cerveza.estilo}', '${cerveza.imagen_url}', ${cerveza.stock_disponible})" title="Gestionar Stock">
                      <i class="fas fa-warehouse"></i>
                    </button>
                    ${self.currentUser?.rol === 'admin' ? `
                      <button class="btn-small btn-danger" onclick="deleteCerveza(${cerveza.id})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                      </button>
                    ` : ''}
                  </td>
                </tr>
              `).join('');
            }
          },
          error: (err: any) => {
            console.error('Error al cargar cervezas:', err);
            showMessage('Error al cargar cervezas', 'error');
          }
        });
      }

      // Cargar pedidos para admin
      function loadAdminPedidos(estado?: string) {
        self.databaseService.getAdminPedidos(estado).subscribe({
          next: (pedidos: any[]) => {
            const tbody = document.getElementById('ordersTableBody');
            if (tbody) {
              tbody.innerHTML = pedidos.map((pedido: any) => {
                // Determinar icono y texto del método de pago
                let metodoPagoIcon = 'fa-credit-card';
                let metodoPagoText = 'Tarjeta';
                let metodoPagoClass = 'payment-method-tarjeta';
                
                if (pedido.metodo_pago === 'paypal') {
                  metodoPagoIcon = 'fab fa-paypal';
                  metodoPagoText = 'PayPal';
                  metodoPagoClass = 'payment-method-paypal';
                } else if (pedido.metodo_pago === 'efectivo') {
                  metodoPagoIcon = 'fa-money-bill-wave';
                  metodoPagoText = 'Efectivo';
                  metodoPagoClass = 'payment-method-efectivo';
                } else if (pedido.metodo_pago === 'transferencia') {
                  metodoPagoIcon = 'fa-university';
                  metodoPagoText = 'Transferencia';
                  metodoPagoClass = 'payment-method-transferencia';
                } else if (pedido.metodo_pago === 'tarjeta' || !pedido.metodo_pago) {
                  metodoPagoIcon = 'fa-credit-card';
                  metodoPagoText = 'Tarjeta';
                  metodoPagoClass = 'payment-method-tarjeta';
                }

                return `
                <tr>
                  <td>#${pedido.id}</td>
                  <td>
                    <div>
                      <strong>${pedido.nombre_completo}</strong><br>
                      <small>${pedido.email}</small>
                    </div>
                  </td>
                  <td>${new Date(pedido.fecha_pedido).toLocaleDateString('es-ES')}</td>
                  <td>$${Number(pedido.total).toFixed(2)}</td>
                  <td>
                    <span class="payment-method-badge ${metodoPagoClass}">
                      <i class="fas ${metodoPagoIcon}"></i>
                      <span>${metodoPagoText}</span>
                    </span>
                  </td>
                  <td>
                    <select class="status-select" onchange="updatePedidoEstado(${pedido.id}, this.value)">
                      <option value="pendiente" ${pedido.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                      <option value="confirmado" ${pedido.estado === 'confirmado' ? 'selected' : ''}>Confirmado</option>
                      <option value="en_preparacion" ${pedido.estado === 'en_preparacion' ? 'selected' : ''}>En Preparación</option>
                      <option value="enviado" ${pedido.estado === 'enviado' ? 'selected' : ''}>Enviado</option>
                      <option value="entregado" ${pedido.estado === 'entregado' ? 'selected' : ''}>Entregado</option>
                      <option value="cancelado" ${pedido.estado === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                    </select>
                  </td>
                  <td>
                    <button class="btn-small" onclick="showPedidoDetails(${pedido.id})">
                      <i class="fas fa-eye"></i>
                    </button>
                  </td>
                </tr>
              `;
              }).join('');
            }
          },
          error: (err: any) => {
            console.error('Error al cargar pedidos:', err);
            showMessage('Error al cargar pedidos', 'error');
          }
        });
      }

      // Mostrar detalles de un pedido (modal simple o alerta por ahora)
      ;(window as any).showPedidoDetails = (pedidoId: number) => {
        // En esta versión, solo mostramos un mensaje. Se puede ampliar para cargar items y mostrar un modal.
        showMessage(`Detalles del pedido #${pedidoId} (vista en desarrollo)`, 'info');
      };

      // Cargar usuarios para admin
      function loadAdminUsuarios(rol?: string) {
        if (self.currentUser?.rol !== 'admin') {
          const tbody = document.getElementById('usersTableBody');
          if (tbody) {
            tbody.innerHTML = `
              <tr>
                <td colspan="6" style="text-align: center; opacity: 0.7; padding: 20px;">
                  Solo los administradores pueden ver esta información
                </td>
              </tr>
            `;
          }
          return;
        }
        
        self.databaseService.getAdminUsuarios(rol).subscribe({
          next: (usuarios: any[]) => {
            const tbody = document.getElementById('usersTableBody');
            if (tbody) {
              if (usuarios.length === 0) {
                tbody.innerHTML = `
                  <tr>
                    <td colspan="6" style="text-align: center; opacity: 0.7; padding: 20px;">
                      No hay usuarios para mostrar
                    </td>
                  </tr>
                `;
              } else {
                tbody.innerHTML = usuarios.map((usuario: any) => `
                  <tr>
                    <td>${usuario.id}</td>
                    <td>${usuario.nombre_completo}</td>
                    <td>${usuario.email}</td>
                    <td>
                      <select class="role-select" onchange="updateUsuarioRol(${usuario.id}, this.value)">
                        <option value="cliente" ${usuario.rol === 'cliente' ? 'selected' : ''}>Cliente</option>
                        <option value="vendedor" ${usuario.rol === 'vendedor' ? 'selected' : ''}>Vendedor</option>
                        <option value="admin" ${usuario.rol === 'admin' ? 'selected' : ''}>Admin</option>
                      </select>
                    </td>
                    <td>${new Date(usuario.fecha_registro).toLocaleDateString('es-ES')}</td>
                    <td>
                      <span class="status-badge ${usuario.activo ? 'active' : 'inactive'}">
                        ${usuario.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                `).join('');
              }
            }
          },
          error: (err: any) => {
            console.warn('Error al cargar usuarios:', err);
            const tbody = document.getElementById('usersTableBody');
            if (tbody) {
              tbody.innerHTML = `
                <tr>
                  <td colspan="6" style="text-align: center; opacity: 0.7; padding: 20px;">
                    No se pudieron cargar los usuarios
                  </td>
                </tr>
              `;
            }
          }
        });
      }

      // Función para actualizar estado de pedido
      (window as any).updatePedidoEstado = (pedidoId: number, nuevoEstado: string) => {
        self.databaseService.updatePedidoEstado(pedidoId, nuevoEstado).subscribe({
          next: () => {
            showMessage(`Pedido #${pedidoId} actualizado a ${nuevoEstado}`, 'success');
            loadAdminPedidos();
          },
          error: (err: any) => {
            showMessage('Error al actualizar estado del pedido', 'error');
            console.error(err);
          }
        });
      };

      // Función para actualizar rol de usuario
      (window as any).updateUsuarioRol = (usuarioId: number, nuevoRol: string) => {
        self.databaseService.updateUsuarioRol(usuarioId, nuevoRol).subscribe({
          next: () => {
            showMessage(`Usuario #${usuarioId} actualizado a ${nuevoRol}`, 'success');
            loadAdminUsuarios();
          },
          error: (err: any) => {
            showMessage('Error al actualizar rol del usuario', 'error');
            console.error(err);
          }
        });
      };

      // Función para filtrar pedidos
      (window as any).filterPedidos = () => {
        const estado = (document.getElementById('pedidosFilter') as HTMLSelectElement).value;
        loadAdminPedidos(estado || undefined);
      };

      // Función para filtrar usuarios
      (window as any).filterUsuarios = () => {
        const rol = (document.getElementById('usuariosFilter') as HTMLSelectElement).value;
        loadAdminUsuarios(rol || undefined);
      };

      // Manejar login de admin
      document.getElementById('adminLoginForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const currentTarget = e.currentTarget as HTMLElement | null;
        
        const emailInput = document.getElementById('adminEmail') as HTMLInputElement;
        const passwordInput = document.getElementById('adminPassword') as HTMLInputElement;
        
        if (!emailInput || !passwordInput) {
          showMessage('Error: elementos del formulario no encontrados', 'error');
          return;
        }
        
        const email = emailInput.value;
        const password = passwordInput.value;
        const button = currentTarget ? (currentTarget.querySelector('.login-button') as HTMLButtonElement) : null;
        if (!button) return;
        const buttonText = button.querySelector('.button-text') as HTMLElement;
        const spinner = button.querySelector('.loading-spinner') as HTMLElement;
        
        if (!email || !password) {
          showMessage('Por favor completa todos los campos', 'error');
          return;
        }

        // Mostrar loading
        buttonText.style.display = 'none';
        spinner.style.display = 'inline-block';
        button.disabled = true;

        self.databaseService.login(email, password).subscribe({
          next: (resp: any) => {
            // Verificar si es admin o vendedor
            if (resp.user.rol !== 'admin' && resp.user.rol !== 'vendedor') {
              showMessage('Acceso denegado. Se requiere rol de administrador o vendedor', 'error');
              self.databaseService.logout();
              return;
            }

            self.currentUser = resp.user;
            showView(views.adminDashboard);
            loadAdminStats();
            showMessage(`¡Bienvenido al panel de administración, ${resp.user.nombre_completo}!`, 'success');
            
            // Limpiar formulario
            const adminEmailInput = document.getElementById('adminEmail') as HTMLInputElement;
            const adminPasswordInput = document.getElementById('adminPassword') as HTMLInputElement;
            if (adminEmailInput) adminEmailInput.value = '';
            if (adminPasswordInput) adminPasswordInput.value = '';
          },
          error: (err: any) => {
            const msg = err?.error?.error || 'Credenciales inválidas';
            showMessage(msg, 'error');
          },
          complete: () => {
            // Restaurar botón
            buttonText.style.display = 'inline';
            spinner.style.display = 'none';
            button.disabled = false;
          }
        });
      });

      // ========== FUNCIONES DE GESTIÓN DE CERVEZAS ==========
      
      // Nota: closeAllModals ya está definida al inicio del bloque setTimeout

      // Función para mostrar formulario de nueva cerveza
      (window as any).showAddBeerForm = () => {
        closeAllModals(); // Cerrar todos los modales primero
        const titleElement = document.getElementById('beerModalTitle');
        const formElement = document.getElementById('beerForm') as HTMLFormElement;
        const activeElement = document.getElementById('beerActive') as HTMLInputElement;
        const modalElement = document.getElementById('beerModal');
        
        if (titleElement) titleElement.textContent = 'Nueva Cerveza';
        if (formElement) formElement.reset();
        if (activeElement) activeElement.checked = true;
        if (modalElement) modalElement.style.display = 'flex';
      };

      // Función para editar cerveza
      (window as any).editCerveza = (cervezaId: number) => {
        // Buscar la cerveza en la lista actual
        self.databaseService.getAdminCervezas().subscribe({
          next: (cervezas: any[]) => {
            const cerveza = cervezas.find((c: any) => c.id === cervezaId);
            if (cerveza) {
              const titleElement = document.getElementById('beerModalTitle');
              if (titleElement) titleElement.textContent = 'Editar Cerveza';
              
              const beerNameInput = document.getElementById('beerName') as HTMLInputElement;
              const beerStyleInput = document.getElementById('beerStyle') as HTMLInputElement;
              const beerDescriptionInput = document.getElementById('beerDescription') as HTMLInputElement;
              const beerPriceInput = document.getElementById('beerPrice') as HTMLInputElement;
              const beerPointsInput = document.getElementById('beerPoints') as HTMLInputElement;
              const beerStockInput = document.getElementById('beerStock') as HTMLInputElement;
              const beerCategoryInput = document.getElementById('beerCategory') as HTMLInputElement;
              const beerImageInput = document.getElementById('beerImage') as HTMLInputElement;
              const beerActiveInput = document.getElementById('beerActive') as HTMLInputElement;
              
              if (beerNameInput) beerNameInput.value = cerveza.nombre;
              if (beerStyleInput) beerStyleInput.value = cerveza.estilo;
              if (beerDescriptionInput) beerDescriptionInput.value = cerveza.descripcion || '';
              if (beerPriceInput) beerPriceInput.value = cerveza.precio;
              if (beerPointsInput) beerPointsInput.value = cerveza.puntos_ganados;
              if (beerStockInput) beerStockInput.value = cerveza.stock_disponible;
              if (beerCategoryInput) beerCategoryInput.value = cerveza.categoria_id || '';
              if (beerImageInput) beerImageInput.value = cerveza.imagen_url || '';
              if (beerActiveInput) beerActiveInput.checked = cerveza.activa;
              
              // Guardar ID para la actualización
              (document.getElementById('beerForm') as any).dataset.cervezaId = cervezaId;
              closeAllModals(); // Cerrar todos los modales primero
              const beerModalEl = document.getElementById('beerModal');
              if (beerModalEl) beerModalEl.style.display = 'flex';
            }
          },
          error: (err: any) => {
            showMessage('Error al cargar datos de la cerveza', 'error');
          }
        });
      };

      // Función para gestionar stock
      (window as any).manageStock = (cervezaId: number, nombre: string, estilo: string, imagenUrl: string, stockActual: number) => {
        const stockBeerNameEl = document.getElementById('stockBeerName');
        const stockBeerStyleEl = document.getElementById('stockBeerStyle');
        const currentStockEl = document.getElementById('currentStock');
        const stockBeerImageEl = document.getElementById('stockBeerImage') as HTMLImageElement;
        const stockModalEl = document.getElementById('stockModal');
        
        if (stockBeerNameEl) stockBeerNameEl.textContent = nombre;
        if (stockBeerStyleEl) stockBeerStyleEl.textContent = estilo;
        if (currentStockEl) currentStockEl.textContent = stockActual.toString();
        if (stockBeerImageEl) {
          const normalizeFn = (window as any).normalizeImageUrl;
          if (normalizeFn) {
            stockBeerImageEl.src = normalizeFn(imagenUrl, nombre || 'Cerveza', '100x100');
          } else {
            stockBeerImageEl.src = imagenUrl || 'https://via.placeholder.com/100x100/EEE/333?text=Cerveza';
          }
        }
        
        // Guardar datos para el formulario
        (document.getElementById('stockForm') as any).dataset.cervezaId = cervezaId;
        (document.getElementById('stockForm') as any).dataset.stockActual = stockActual;
        
        closeAllModals(); // Cerrar todos los modales primero
        if (stockModalEl) stockModalEl.style.display = 'flex';
      };

      // Función para eliminar cerveza (solo admin)
      (window as any).deleteCerveza = (cervezaId: number) => {
        if (confirm('¿Estás seguro de que quieres eliminar esta cerveza? Esta acción no se puede deshacer.')) {
          self.databaseService.deleteCerveza(cervezaId).subscribe({
            next: () => {
              showMessage('Cerveza eliminada exitosamente', 'success');
              loadAdminCervezas();
            },
            error: (err: any) => {
              const msg = err?.error?.error || 'Error al eliminar la cerveza';
              showMessage(msg, 'error');
            }
          });
        }
      };

      // Función para cerrar modal de cerveza
      (window as any).closeBeerModal = () => {
        closeAllModals(); // Usar función centralizada
        const beerForm = document.getElementById('beerForm') as any;
        if (beerForm) beerForm.dataset.cervezaId = '';
      };

      // Función para cerrar modal de stock
      (window as any).closeStockModal = () => {
        closeAllModals(); // Usar función centralizada
        const stockForm = document.getElementById('stockForm') as any;
        if (stockForm) stockForm.dataset.cervezaId = '';
      };

      // Manejar formulario de cerveza
      document.getElementById('beerForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const form = e.currentTarget as HTMLFormElement;
        const cervezaId = (form.dataset as Record<string, string | undefined>)["cervezaId"];
        const button = form.querySelector('.btn-primary') as HTMLButtonElement;
        const buttonText = button.querySelector('.button-text') as HTMLElement;
        const spinner = button.querySelector('.loading-spinner') as HTMLElement;

        const cervezaData = {
          nombre: (document.getElementById('beerName') as HTMLInputElement).value,
          estilo: (document.getElementById('beerStyle') as HTMLInputElement).value,
          descripcion: (document.getElementById('beerDescription') as HTMLTextAreaElement).value,
          precio: parseFloat((document.getElementById('beerPrice') as HTMLInputElement).value),
          puntos_ganados: parseInt((document.getElementById('beerPoints') as HTMLInputElement).value),
          stock_disponible: parseInt((document.getElementById('beerStock') as HTMLInputElement).value),
          categoria_id: parseInt((document.getElementById('beerCategory') as HTMLSelectElement).value),
          imagen_url: (document.getElementById('beerImage') as HTMLInputElement).value,
          activa: (document.getElementById('beerActive') as HTMLInputElement).checked
        };

        // Mostrar loading
        buttonText.style.display = 'none';
        spinner.style.display = 'inline-block';
        button.disabled = true;

        if (cervezaId) {
          // Actualizar cerveza existente
          self.databaseService.updateCerveza(parseInt(cervezaId), cervezaData).subscribe({
            next: () => {
              showMessage('Cerveza actualizada exitosamente', 'success');
              (window as any).closeBeerModal();
              loadAdminCervezas();
            },
            error: (err: any) => {
              const msg = err?.error?.error || 'Error al actualizar la cerveza';
              showMessage(msg, 'error');
            },
            complete: () => {
              buttonText.style.display = 'inline';
              spinner.style.display = 'none';
              button.disabled = false;
            }
          });
        } else {
          // Crear nueva cerveza
          self.databaseService.createCerveza(cervezaData).subscribe({
            next: () => {
              showMessage('Cerveza creada exitosamente', 'success');
              (window as any).closeBeerModal();
              loadAdminCervezas();
            },
            error: (err: any) => {
              const msg = err?.error?.error || 'Error al crear la cerveza';
              showMessage(msg, 'error');
            },
            complete: () => {
              buttonText.style.display = 'inline';
              spinner.style.display = 'none';
              button.disabled = false;
            }
          });
        }
      });

      // Manejar formulario de stock
      document.getElementById('stockForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const form = e.currentTarget as HTMLFormElement;
        const cervezaIdStr = (form.dataset as Record<string, string | undefined>)["cervezaId"];
        const stockActualStr = (form.dataset as Record<string, string | undefined>)["stockActual"];
        if (!cervezaIdStr || !stockActualStr) {
          showMessage('Datos de stock incompletos', 'error');
          return;
        }
        const cervezaId = parseInt(cervezaIdStr);
        const stockActual = parseInt(stockActualStr);
        const button = form.querySelector('.btn-primary') as HTMLButtonElement;
        const buttonText = button.querySelector('.button-text') as HTMLElement;
        const spinner = button.querySelector('.loading-spinner') as HTMLElement;

        const accion = (document.getElementById('stockAction') as HTMLSelectElement).value;
        const cantidad = parseInt((document.getElementById('stockQuantity') as HTMLInputElement).value);
        const motivo = (document.getElementById('stockReason') as HTMLSelectElement).value;

        let nuevoStock = stockActual;
        switch (accion) {
          case 'add':
            nuevoStock = stockActual + cantidad;
            break;
          case 'remove':
            nuevoStock = Math.max(0, stockActual - cantidad);
            break;
          case 'set':
            nuevoStock = cantidad;
            break;
        }

        // Mostrar loading
        buttonText.style.display = 'none';
        spinner.style.display = 'inline-block';
        button.disabled = true;

        // Actualizar stock
        self.databaseService.updateCerveza(cervezaId, { stock_disponible: nuevoStock }).subscribe({
          next: () => {
            showMessage(`Stock actualizado: ${stockActual} → ${nuevoStock} (${motivo})`, 'success');
            (window as any).closeStockModal();
            loadAdminCervezas();
          },
          error: (err: any) => {
            const msg = err?.error?.error || 'Error al actualizar el stock';
            showMessage(msg, 'error');
          },
          complete: () => {
            buttonText.style.display = 'inline';
            spinner.style.display = 'none';
            button.disabled = false;
          }
        });
      });

      // Cerrar modales al hacer clic fuera
      document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains('modal')) {
          target.style.display = 'none';
        }
      });
      
      // Event listeners de puntos y checkout
      document.getElementById('applyPointsBtn')?.addEventListener('click', applyPointsDiscount);
      document.getElementById('checkoutBtn')?.addEventListener('click', processCheckout);
      
      // Filtros de búsqueda
      document.getElementById('searchBeer')?.addEventListener('input', filterBeers);
      document.getElementById('filterStyle')?.addEventListener('change', filterBeers);
      document.getElementById('filterPrice')?.addEventListener('change', filterBeers);
      document.getElementById('filterRating')?.addEventListener('change', filterBeers);
      document.getElementById('filterCategory')?.addEventListener('change', filterBeers);
      document.getElementById('sortBy')?.addEventListener('change', filterBeers);
      document.getElementById('clearFilters')?.addEventListener('click', clearAllFilters);
      document.getElementById('clearSearch')?.addEventListener('click', clearSearch);
      
      // Efecto de partículas
      function createFloatingParticle() {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        particle.style.left = Math.random() * 100 + 'vw';
        particle.style.top = (100 + Math.random() * 50) + 'vh'; 
        
        const size = (Math.random() * 5 + 2);
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.animationDuration = (Math.random() * 10 + 10) + 's'; 
        particle.style.animationDelay = Math.random() * 5 + 's';
        particle.style.opacity = (Math.random() * 0.7 + 0.3).toString();
        
        document.body.appendChild(particle);
        
        setTimeout(() => {
          particle.remove();
        }, 25000); 
      }

      const particleInterval = setInterval(createFloatingParticle, 300); 

      for(let i = 0; i < 20; i++) {
        createFloatingParticle();
      }
      
      // ========== FUNCIONES DE REPORTES Y ANALYTICS ==========

      // Cargar reportes avanzados
      (window as any).cargarReportes = () => {
        const periodo = (document.getElementById('reportePeriodo') as HTMLSelectElement).value;
        let fechaInicio, fechaFin;
        
        if (periodo === 'custom') {
          fechaInicio = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          fechaFin = new Date().toISOString().split('T')[0];
        } else {
          const dias = parseInt(periodo);
          fechaInicio = new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          fechaFin = new Date().toISOString().split('T')[0];
        }

        // Cargar reportes de ventas
        self.databaseService.getReportesVentas('mes', fechaInicio, fechaFin).subscribe({
          next: (reportes: any) => {
            const ventasTotales = document.getElementById('ventasTotales');
            const ticketPromedio = document.getElementById('ticketPromedio');
            const totalPedidos = document.getElementById('totalPedidos');
            const clientesUnicos = document.getElementById('clientesUnicos');
            
            if (ventasTotales) ventasTotales.textContent = `$${Number(reportes.ventas_totales.ventas_totales || 0).toFixed(2)}`;
            if (ticketPromedio) ticketPromedio.textContent = `$${Number(reportes.ventas_totales.ticket_promedio || 0).toFixed(2)} promedio`;
            if (totalPedidos) totalPedidos.textContent = String(reportes.ventas_totales.total_pedidos || 0);
            if (clientesUnicos) clientesUnicos.textContent = `${reportes.ventas_totales.clientes_unicos || 0} clientes únicos`;

            const topProducts = document.getElementById('topProducts');
            if (topProducts) {
              topProducts.innerHTML = reportes.productos_mas_vendidos.map((producto: any, index: number) => `
                <div class="product-item">
                  <div class="product-rank">${index + 1}</div>
                  <img src="${normalizeImageUrl(producto.imagen_url, producto.nombre || 'Cerveza', '40x40')}" 
                       alt="${producto.nombre}" class="product-image">
                  <div class="product-info">
                    <h4>${producto.nombre}</h4>
                    <p>${producto.cantidad_vendida} unidades vendidas</p>
                    <small>$${Number(producto.ingresos).toFixed(2)} en ingresos</small>
                  </div>
                </div>
              `).join('');
            }

            const topCustomers = document.getElementById('topCustomers');
            if (topCustomers) {
              topCustomers.innerHTML = reportes.clientes_mas_activos.map((cliente: any, index: number) => `
                <div class="customer-item">
                  <div class="customer-rank">${index + 1}</div>
                  <div class="customer-info">
                    <h4>${cliente.nombre_completo}</h4>
                    <p>${cliente.email}</p>
                    <small>${cliente.total_pedidos} pedidos - $${Number(cliente.total_gastado).toFixed(2)} gastado</small>
                  </div>
                </div>
              `).join('');
            }
          },
          error: (err: any) => {
            console.error('Error al cargar reportes:', err);
            showMessage('Error al cargar reportes', 'error');
          }
        });

        // Cargar analytics avanzados
        self.databaseService.getAnalytics().subscribe({
          next: (analytics: any) => {
            const tasaConversion = document.getElementById('tasaConversion');
            const clientesActivos = document.getElementById('clientesActivos');
            const diasPromedio = document.getElementById('diasPromedio');
            
            if (tasaConversion) tasaConversion.textContent = `${Number(analytics.metricas_rendimiento.tasa_conversion || 0).toFixed(1)}%`;
            if (clientesActivos) clientesActivos.textContent = `${analytics.metricas_rendimiento.clientes_activos_30d || 0} clientes activos`;
            if (diasPromedio) diasPromedio.textContent = `${Number(analytics.metricas_rendimiento.dias_promedio_entre_pedidos || 0).toFixed(0)}`;

            const demandPrediction = document.getElementById('demandPrediction');
            if (demandPrediction) {
              demandPrediction.innerHTML = analytics.prediccion_demanda.map((item: any) => `
                <div class="demand-item ${item.estado_stock.toLowerCase()}">
                  <div class="demand-product">
                    <h4>${item.nombre}</h4>
                    <p>Stock: ${item.stock_disponible} unidades</p>
                  </div>
                  <div class="demand-metrics">
                    <span class="demand-days">${Number(item.dias_restantes_stock).toFixed(0)} días restantes</span>
                    <span class="demand-status ${item.estado_stock.toLowerCase()}">${item.estado_stock}</span>
                  </div>
                </div>
              `).join('');
            }
          },
          error: (err: any) => {
            console.error('Error al cargar analytics:', err);
          }
        });
      };

      // ========== FUNCIONES DE NOTIFICACIONES ==========

      function loadNotificaciones() {
        // Solo cargar notificaciones si el usuario es admin o vendedor
        if (!self.currentUser || (self.currentUser.rol !== 'admin' && self.currentUser.rol !== 'vendedor')) {
          const notificationsList = document.getElementById('notificationsList');
          if (notificationsList) {
            notificationsList.innerHTML = `
              <div class="notification-item">
                <div class="notification-content">
                  <p style="text-align: center; opacity: 0.7;">Las notificaciones solo están disponibles para administradores y vendedores</p>
                </div>
              </div>
            `;
          }
          return;
        }

        self.databaseService.getNotificaciones().subscribe({
          next: (notificaciones: any[]) => {
            const notificationsList = document.getElementById('notificationsList');
            if (notificationsList) {
              if (notificaciones.length === 0) {
                notificationsList.innerHTML = `
                  <div class="notification-item">
                    <div class="notification-content">
                      <p style="text-align: center; opacity: 0.7;">No hay notificaciones</p>
                    </div>
                  </div>
                `;
              } else {
                notificationsList.innerHTML = notificaciones.map((notif: any) => `
                  <div class="notification-item ${notif.leida ? 'read' : 'unread'}">
                    <div class="notification-icon">
                      <i class="fas fa-${getNotificationIcon(notif.tipo)}"></i>
                    </div>
                    <div class="notification-content">
                      <h4>${notif.titulo}</h4>
                      <p>${notif.mensaje}</p>
                      <small>${new Date(notif.fecha_creacion).toLocaleString('es-ES')}</small>
                    </div>
                    <div class="notification-actions">
                      ${!notif.leida ? `
                        <button class="btn-small" onclick="marcarNotificacionLeida(${notif.id})">
                          <i class="fas fa-check"></i>
                        </button>
                      ` : ''}
                    </div>
                  </div>
                `).join('');
              }
            }
          },
          error: (err: any) => {
            console.warn('Error al cargar notificaciones:', err);
            const notificationsList = document.getElementById('notificationsList');
            if (notificationsList) {
              notificationsList.innerHTML = `
                <div class="notification-item">
                  <div class="notification-content">
                    <p style="text-align: center; opacity: 0.7;">No hay notificaciones disponibles</p>
                  </div>
                </div>
              `;
            }
          }
        });
      }

      function getNotificationIcon(tipo: string): string {
        switch(tipo) {
          case 'stock_bajo': return 'exclamation-triangle';
          case 'nuevo_pedido': return 'shopping-cart';
          case 'recordatorio': return 'clock';
          case 'sistema': return 'cog';
          default: return 'bell';
        }
      }

      (window as any).showCreateNotificationForm = () => {
        closeAllModals(); // Cerrar todos los modales primero
        const notificationModal = document.getElementById('notificationModal');
        if (notificationModal) notificationModal.style.display = 'flex';
        
        if (self.currentUser?.rol === 'admin') {
          self.databaseService.getAdminUsuarios().subscribe({
            next: (usuarios: any[]) => {
              const select = document.getElementById('notificationUser') as HTMLSelectElement;
              if (select) {
                select.innerHTML = '<option value="">Todos los usuarios</option>' +
                  usuarios.map((u: any) => `<option value="${u.id}">${u.nombre_completo} (${u.email})</option>`).join('');
              }
            },
            error: (err: any) => {
              console.warn('Error al cargar usuarios para notificaciones:', err);
            }
          });
        }
      };

      (window as any).closeNotificationModal = () => {
        closeAllModals(); // Usar función centralizada
        const notificationForm = document.getElementById('notificationForm') as HTMLFormElement;
        if (notificationForm) notificationForm.reset();
      };

      // Agregar listeners para cerrar modales al hacer clic fuera
      const setupModalCloseListeners = () => {
        const modals = ['beerModal', 'stockModal', 'notificationModal', 'discountModal', 'repartidorModal'];
        modals.forEach(modalId => {
          const modal = document.getElementById(modalId);
          if (modal) {
            // Remover listeners anteriores para evitar duplicados
            const newModal = modal.cloneNode(true);
            modal.parentNode?.replaceChild(newModal, modal);
            
            // Cerrar al hacer clic en el fondo (fuera del contenido)
            newModal.addEventListener('click', (e) => {
              if (e.target === newModal) {
                closeAllModals();
              }
            });
          }
        });
        
        // Agregar listener para messagePopup (islas flotantes)
        const messagePopup = document.getElementById('messagePopup');
        if (messagePopup) {
          // Usar una función de handler para poder removerla si es necesario
          const handleMessagePopupClick = (e: MouseEvent) => {
            const messageContent = messagePopup.querySelector('.message-content');
            if (messageContent && !messageContent.contains(e.target as Node) && e.target === messagePopup) {
              closeAllModals();
            }
          };
          
          // Remover listener anterior si existe
          messagePopup.removeEventListener('click', handleMessagePopupClick as EventListener);
          // Agregar nuevo listener
          messagePopup.addEventListener('click', handleMessagePopupClick);
          
          // Asegurar que el botón de cerrar funcione
          const closeMessageBtn = document.getElementById('closeMessage');
          if (closeMessageBtn) {
            const handleCloseClick = () => {
              closeAllModals();
            };
            // Remover listener anterior si existe
            closeMessageBtn.removeEventListener('click', handleCloseClick);
            // Agregar nuevo listener
            closeMessageBtn.addEventListener('click', handleCloseClick);
          }
        }
      };

      // Cerrar modales con la tecla ESC
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          closeAllModals();
        }
      });

      // Inicializar listeners de cierre
      setupModalCloseListeners();

      (window as any).marcarNotificacionLeida = (id: number) => {
        self.databaseService.marcarNotificacionLeida(id).subscribe({
          next: () => {
            loadNotificaciones();
          },
          error: (err: any) => {
            showMessage('Error al marcar notificación', 'error');
          }
        });
      };

      // ========== FUNCIONES DE DESCUENTOS ==========

      function loadDescuentos() {
        // Solo admin puede cargar descuentos
        if (self.currentUser?.rol !== 'admin') {
          const tbody = document.getElementById('discountsTableBody');
          if (tbody) {
            tbody.innerHTML = `
              <tr>
                <td colspan="8" style="text-align: center; opacity: 0.7; padding: 20px;">
                  Solo los administradores pueden gestionar descuentos
                </td>
              </tr>
            `;
          }
          return;
        }

        self.databaseService.getDescuentos().subscribe({
          next: (descuentos: any[]) => {
            const tbody = document.getElementById('discountsTableBody');
            if (tbody) {
              if (descuentos.length === 0) {
                tbody.innerHTML = `
                  <tr>
                    <td colspan="8" style="text-align: center; opacity: 0.7; padding: 20px;">
                      No hay descuentos creados. Haz clic en "Crear Descuento" para agregar uno.
                    </td>
                  </tr>
                `;
              } else {
                tbody.innerHTML = descuentos.map((desc: any) => `
                  <tr>
                    <td><strong>${desc.codigo}</strong></td>
                    <td>${desc.tipo === 'porcentaje' ? 'Porcentaje' : 'Cantidad Fija'}</td>
                    <td>${desc.tipo === 'porcentaje' ? `${desc.valor}%` : `$${desc.valor}`}</td>
                    <td>${new Date(desc.fecha_inicio).toLocaleDateString('es-ES')}</td>
                    <td>${new Date(desc.fecha_fin).toLocaleDateString('es-ES')}</td>
                    <td>${desc.uso_actual}/${desc.uso_maximo || '∞'}</td>
                    <td>
                      <span class="status-badge ${desc.activo ? 'active' : 'inactive'}">
                        ${desc.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <button class="btn-small" onclick="editDescuento(${desc.id})">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="btn-small btn-danger" onclick="deleteDescuento(${desc.id})">
                        <i class="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                `).join('');
              }
            }
          },
          error: (err: any) => {
            console.warn('Error al cargar descuentos:', err);
            const tbody = document.getElementById('discountsTableBody');
            if (tbody) {
              tbody.innerHTML = `
                <tr>
                  <td colspan="8" style="text-align: center; opacity: 0.7; padding: 20px;">
                    No se pudieron cargar los descuentos
                  </td>
                </tr>
              `;
            }
          }
        });
      }

      (window as any).showCreateDiscountForm = () => {
        closeAllModals(); // Cerrar todos los modales primero
        const discountModal = document.getElementById('discountModal');
        if (discountModal) discountModal.style.display = 'flex';
        
        const now = new Date();
        const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        
        const startDateInput = document.getElementById('discountStartDate') as HTMLInputElement;
        const endDateInput = document.getElementById('discountEndDate') as HTMLInputElement;
        
        if (startDateInput) startDateInput.value = now.toISOString().slice(0, 16);
        if (endDateInput) endDateInput.value = nextMonth.toISOString().slice(0, 16);

        self.databaseService.getAdminCervezas().subscribe({
          next: (cervezas: any[]) => {
            const select = document.getElementById('discountProduct') as HTMLSelectElement;
            select.innerHTML = '<option value="">Seleccionar producto</option>' +
              cervezas.map((c: any) => `<option value="${c.id}">${c.nombre}</option>`).join('');
          }
        });
      };

      (window as any).closeDiscountModal = () => {
        closeAllModals(); // Usar función centralizada
        const form = document.getElementById('discountForm') as HTMLFormElement | null;
        if (form) form.reset();
      };

      (window as any).editDescuento = (id: number) => {
        showMessage('Función de edición en desarrollo', 'info');
      };

      (window as any).deleteDescuento = (id: number) => {
        if (confirm('¿Estás seguro de que quieres eliminar este descuento?')) {
          self.databaseService.eliminarDescuento(id).subscribe({
            next: () => {
              showMessage('Descuento eliminado exitosamente', 'success');
              loadDescuentos();
            },
            error: (err: any) => {
              showMessage('Error al eliminar descuento', 'error');
            }
          });
        }
      };

      // Manejar formulario de notificación
      document.getElementById('notificationForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const currentTarget = e.currentTarget as HTMLElement | null;
        
        const tipo = (document.getElementById('notificationType') as HTMLSelectElement).value;
        const titulo = (document.getElementById('notificationTitle') as HTMLInputElement).value;
        const mensaje = (document.getElementById('notificationMessage') as HTMLTextAreaElement).value;
        const usuarioId = (document.getElementById('notificationUser') as HTMLSelectElement).value;

        const button = currentTarget ? (currentTarget.querySelector('.btn-primary') as HTMLButtonElement) : null;
        if (!button) return;
        const buttonText = button.querySelector('.button-text') as HTMLElement;
        const spinner = button.querySelector('.loading-spinner') as HTMLElement;

        buttonText.style.display = 'none';
        spinner.style.display = 'inline-block';
        button.disabled = true;

        self.databaseService.crearNotificacion(tipo, titulo, mensaje, usuarioId ? parseInt(usuarioId) : undefined).subscribe({
          next: () => {
            showMessage('Notificación creada exitosamente', 'success');
            (window as any).closeNotificationModal();
            loadNotificaciones();
          },
          error: (err: any) => {
            showMessage('Error al crear notificación', 'error');
          },
          complete: () => {
            buttonText.style.display = 'inline';
            spinner.style.display = 'none';
            button.disabled = false;
          }
        });
      });

      // Manejar formulario de descuento
      document.getElementById('discountForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const currentTarget = e.currentTarget as HTMLElement | null;
        
        const aplicable = (document.getElementById('discountApplicable') as HTMLSelectElement).value;
        let categoriaId = null;
        let productoId = null;

        if (aplicable === 'categoria') {
          categoriaId = parseInt((document.getElementById('discountCategory') as HTMLSelectElement).value);
        } else if (aplicable === 'producto') {
          productoId = parseInt((document.getElementById('discountProduct') as HTMLSelectElement).value);
        }

        const descuentoData = {
          codigo: (document.getElementById('discountCode') as HTMLInputElement).value,
          tipo: (document.getElementById('discountType') as HTMLSelectElement).value,
          valor: parseFloat((document.getElementById('discountValue') as HTMLInputElement).value),
          descripcion: (document.getElementById('discountDescription') as HTMLTextAreaElement).value,
          fecha_inicio: (document.getElementById('discountStartDate') as HTMLInputElement).value,
          fecha_fin: (document.getElementById('discountEndDate') as HTMLInputElement).value,
          uso_maximo: parseInt((document.getElementById('discountMaxUses') as HTMLInputElement).value) || null,
          aplicable_a: aplicable,
          categoria_id: categoriaId,
          producto_id: productoId
        };

        const button = currentTarget ? (currentTarget.querySelector('.btn-primary') as HTMLButtonElement) : null;
        if (!button) return;
        const buttonText = button.querySelector('.button-text') as HTMLElement;
        const spinner = button.querySelector('.loading-spinner') as HTMLElement;

        buttonText.style.display = 'none';
        spinner.style.display = 'inline-block';
        button.disabled = true;

        self.databaseService.crearDescuento(descuentoData).subscribe({
          next: () => {
            showMessage('Descuento creado exitosamente', 'success');
            (window as any).closeDiscountModal();
            loadDescuentos();
          },
          error: (err: any) => {
            showMessage('Error al crear descuento', 'error');
          },
          complete: () => {
            buttonText.style.display = 'inline';
            spinner.style.display = 'none';
            button.disabled = false;
          }
        });
      });

      // Manejar cambio en aplicable a
      document.getElementById('discountApplicable')?.addEventListener('change', (e) => {
        const aplicable = (e.target as HTMLSelectElement).value;
        const categoryGroup = document.getElementById('categoryGroup');
        const productGroup = document.getElementById('productGroup');
        
        if (categoryGroup && productGroup) {
          categoryGroup.style.display = aplicable === 'categoria' ? 'block' : 'none';
          productGroup.style.display = aplicable === 'producto' ? 'block' : 'none';
        }
      });

      // ========== FUNCIONES DE SERVICIO A DOMICILIO ==========
      
      function loadDeliverySettings() {
        console.log('Cargando configuración de servicio a domicilio...');
        // Aquí se cargarían las configuraciones desde la base de datos
        // Por ahora usamos valores predeterminados que ya están en el HTML
      }

      (window as any).saveDeliverySettings = () => {
        // Obtener todos los valores de los formularios
        const settings = {
          enabled: (document.getElementById('deliveryEnabled') as HTMLInputElement)?.checked,
          businessAddress: (document.getElementById('businessAddress') as HTMLInputElement)?.value,
          businessPhone: (document.getElementById('businessPhone') as HTMLInputElement)?.value,
          businessEmail: (document.getElementById('businessEmail') as HTMLInputElement)?.value,
          baseShippingCost: parseFloat((document.getElementById('baseShippingCost') as HTMLInputElement)?.value || '0'),
          freeShippingFrom: parseFloat((document.getElementById('freeShippingFrom') as HTMLInputElement)?.value || '0'),
          costPerKm: parseFloat((document.getElementById('costPerKm') as HTMLInputElement)?.value || '0'),
          baseRadius: parseInt((document.getElementById('baseRadius') as HTMLInputElement)?.value || '0'),
          minDeliveryTime: parseInt((document.getElementById('minDeliveryTime') as HTMLInputElement)?.value || '0'),
          maxDeliveryTime: parseInt((document.getElementById('maxDeliveryTime') as HTMLInputElement)?.value || '0'),
          deliveryTimeMessage: (document.getElementById('deliveryTimeMessage') as HTMLInputElement)?.value,
          allowNotes: (document.getElementById('allowNotes') as HTMLInputElement)?.checked,
          requireAgeVerification: (document.getElementById('requireAgeVerification') as HTMLInputElement)?.checked,
          realTimeTracking: (document.getElementById('realTimeTracking') as HTMLInputElement)?.checked,
          minOrderAmount: parseFloat((document.getElementById('minOrderAmount') as HTMLInputElement)?.value || '0'),
          deliveryWelcomeMessage: (document.getElementById('deliveryWelcomeMessage') as HTMLTextAreaElement)?.value
        };

        console.log('Guardando configuración de servicio a domicilio:', settings);
        
        // Aquí se guardarían en la base de datos
        // Por ahora solo mostramos un mensaje de éxito
        showMessage('Configuración de servicio a domicilio guardada exitosamente', 'success');
      };

      (window as any).addDeliveryZone = () => {
        // Mostrar modal o formulario para agregar nueva zona
        const zoneName = prompt('Nombre de la zona:');
        if (!zoneName) return;
        
        const postalCode = prompt('Código postal (ej: 04000-04999):');
        if (!postalCode) return;
        
        const additionalCost = prompt('Costo adicional ($):');
        if (!additionalCost) return;
        
        const extraTime = prompt('Tiempo extra (minutos):');
        if (!extraTime) return;

        // Aquí se agregaría a la base de datos
        // Por ahora solo mostramos mensaje
        showMessage(`Zona "${zoneName}" agregada exitosamente`, 'success');
        
        // Recargar la tabla (en producción esto vendría de la BD)
        console.log('Nueva zona agregada:', { zoneName, postalCode, additionalCost, extraTime });
      };

      (window as any).editZone = (zoneId: number) => {
        showMessage('Función de edición en desarrollo', 'info');
        console.log('Editando zona:', zoneId);
      };

      (window as any).deleteZone = (zoneId: number) => {
        if (confirm('¿Estás seguro de eliminar esta zona de entrega?')) {
          showMessage('Zona eliminada exitosamente', 'success');
          console.log('Zona eliminada:', zoneId);
          // Aquí se eliminaría de la base de datos y se recargaría la tabla
        }
      };

      // ========== FUNCIONES DE CORTE DIARIO ==========
      
      function loadCorteDiario() {
        const fechaInput = document.getElementById('corteFecha') as HTMLInputElement;
        const fecha = fechaInput?.value || new Date().toISOString().split('T')[0];
        
        // Establecer la fecha en el input si no está establecida
        if (fechaInput && !fechaInput.value) {
          fechaInput.value = fecha;
        }

        self.databaseService.getCorteDiario(fecha).subscribe({
          next: (data: any) => {
            try {
              renderCorteDiario(data);
            } catch (error) {
              console.error('Error al renderizar corte diario:', error);
              showMessage('Error al mostrar los datos del corte diario', 'error');
            }
          },
          error: (err: any) => {
            console.error('Error al cargar corte diario:', err);
            const errorMsg = err?.error?.error || err?.message || 'Error desconocido';
            showMessage(`Error al cargar el corte diario: ${errorMsg}`, 'error');
            
            // Mostrar mensaje de error en las secciones
            const tbody = document.getElementById('corteProductosTableBody');
            if (tbody) {
              tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px; color: #e74c3c;">Error al cargar productos</td></tr>';
            }
            
            const pedidosTbody = document.getElementById('cortePedidosTableBody');
            if (pedidosTbody) {
              pedidosTbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #e74c3c;">Error al cargar pedidos</td></tr>';
            }
            
            const metodosContainer = document.getElementById('metodosPagoContainer');
            if (metodosContainer) {
              metodosContainer.innerHTML = '<p style="text-align: center; padding: 20px; color: #e74c3c;">Error al cargar métodos de pago</p>';
            }
          }
        });
      }

      function renderCorteDiario(data: any) {
        const resumen = data.resumen || {};
        
        // Actualizar resumen general
        document.getElementById('corteTotalPedidos')!.textContent = resumen.total_pedidos || 0;
        document.getElementById('corteVentasTotales')!.textContent = `$${Number(resumen.ventas_totales || 0).toFixed(2)}`;
        document.getElementById('corteClientesUnicos')!.textContent = resumen.clientes_unicos || 0;
        document.getElementById('corteTicketPromedio')!.textContent = `$${Number(resumen.ticket_promedio || 0).toFixed(2)}`;

        // Actualizar estados de pedidos
        document.getElementById('cortePendientes')!.textContent = resumen.pedidos_pendientes || 0;
        document.getElementById('corteConfirmados')!.textContent = resumen.pedidos_confirmados || 0;
        document.getElementById('corteEnPreparacion')!.textContent = resumen.pedidos_en_preparacion || 0;
        document.getElementById('corteEnviados')!.textContent = resumen.pedidos_enviados || 0;
        document.getElementById('corteEntregados')!.textContent = resumen.pedidos_entregados || 0;
        document.getElementById('corteCancelados')!.textContent = resumen.pedidos_cancelados || 0;

        // Renderizar ventas por hora
        renderVentasPorHora(data.ventas_por_hora || []);

        // Renderizar productos vendidos
        renderProductosVendidos(data.productos_vendidos || []);

        // Renderizar métodos de pago
        renderMetodosPago(data.metodos_pago || []);

        // Renderizar pedidos del día
        renderPedidosDia(data.pedidos || []);
      }

      function renderVentasPorHora(ventasPorHora: any[]) {
        const chartContainer = document.getElementById('ventasPorHoraChart');
        if (!chartContainer) return;

        if (ventasPorHora.length === 0) {
          chartContainer.innerHTML = '<p style="text-align: center; padding: 20px; color: #666;">No hay ventas registradas para este día</p>';
          return;
        }

        const maxVentas = Math.max(...ventasPorHora.map((v: any) => Number(v.ventas || 0)), 1);
        
        chartContainer.innerHTML = `
          <div class="ventas-hora-grid">
            ${ventasPorHora.map((v: any) => {
              const hora = v.hora || 0;
              const ventas = Number(v.ventas || 0);
              const pedidos = v.pedidos || 0;
              const porcentaje = (ventas / maxVentas) * 100;
              
              return `
                <div class="venta-hora-item">
                  <div class="venta-hora-header">
                    <span class="venta-hora-label">${hora}:00</span>
                    <span class="venta-hora-amount">$${ventas.toFixed(2)}</span>
                  </div>
                  <div class="venta-hora-bar">
                    <div class="venta-hora-fill" style="width: ${porcentaje}%"></div>
                  </div>
                  <div class="venta-hora-footer">
                    <span>${pedidos} pedido${pedidos !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `;
      }

      function renderProductosVendidos(productos: any[]) {
        const tbody = document.getElementById('corteProductosTableBody');
        if (!tbody) return;

        if (productos.length === 0) {
          tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px; color: #666;">No hay productos vendidos en este día</td></tr>';
          return;
        }

        const normalizeFn = (window as any).normalizeImageUrl || ((url: string, text: string, size: string) => url || `https://via.placeholder.com/${size}/EEE/333?text=${text}`);
        tbody.innerHTML = productos.map((producto: any) => `
          <tr>
            <td>
              <div style="display: flex; align-items: center; gap: 10px;">
                <img src="${normalizeFn(producto.imagen_url, producto.nombre, '40x40')}" 
                     alt="${producto.nombre}" 
                     style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">
                <div>
                  <strong>${producto.nombre}</strong><br>
                  <small style="color: #666;">${producto.estilo}</small>
                </div>
              </div>
            </td>
            <td><strong>${producto.cantidad_vendida}</strong></td>
            <td>${producto.veces_pedido}</td>
            <td><strong>$${Number(producto.ingresos || 0).toFixed(2)}</strong></td>
          </tr>
        `).join('');
      }

      function renderMetodosPago(metodos: any[]) {
        const container = document.getElementById('metodosPagoContainer');
        if (!container) return;

        if (metodos.length === 0) {
          container.innerHTML = '<p style="text-align: center; padding: 20px; color: #666;">No hay métodos de pago registrados para este día</p>';
          return;
        }

        container.innerHTML = metodos.map((metodo: any) => {
          const total = Number(metodo.total || 0);
          const cantidad = metodo.cantidad || 0;
          const metodoNombre = metodo.metodo_pago || 'tarjeta';
          
          // Determinar icono según método
          let iconClass = 'fa-credit-card';
          let iconBg = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
          
          if (metodoNombre === 'paypal') {
            iconClass = 'fab fa-paypal';
            iconBg = 'linear-gradient(135deg, #003087 0%, #009cde 100%)';
          } else if (metodoNombre === 'efectivo') {
            iconClass = 'fa-money-bill-wave';
            iconBg = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
          } else if (metodoNombre === 'transferencia') {
            iconClass = 'fa-university';
            iconBg = 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
          }
          
          // Formatear nombre del método
          let metodoDisplay = 'Tarjeta';
          if (metodoNombre === 'paypal') metodoDisplay = 'PayPal';
          else if (metodoNombre === 'efectivo') metodoDisplay = 'Efectivo';
          else if (metodoNombre === 'transferencia') metodoDisplay = 'Transferencia';
          
          return `
            <div class="metodo-pago-card">
              <div class="metodo-pago-icon" style="background: ${iconBg};">
                <i class="${iconClass}"></i>
              </div>
              <div class="metodo-pago-content">
                <h4>${metodoDisplay}</h4>
                <p class="metodo-pago-amount">$${total.toFixed(2)}</p>
                <p class="metodo-pago-count">${cantidad} transacción${cantidad !== 1 ? 'es' : ''}</p>
              </div>
            </div>
          `;
        }).join('');
      }

      function renderPedidosDia(pedidos: any[]) {
        const tbody = document.getElementById('cortePedidosTableBody');
        if (!tbody) return;

        if (pedidos.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #666;">No hay pedidos registrados para este día</td></tr>';
          return;
        }

        tbody.innerHTML = pedidos.map((pedido: any) => {
          const fecha = new Date(pedido.fecha_pedido);
          const hora = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
          const estadoClass = pedido.estado?.replace('_', '-') || 'pendiente';
          
          // Determinar icono y texto del método de pago
          const metodoPago = pedido.metodo_pago || 'tarjeta';
          let metodoPagoIcon = 'fa-credit-card';
          let metodoPagoText = 'Tarjeta';
          let metodoPagoClass = 'payment-method-tarjeta';
          
          if (metodoPago === 'paypal') {
            metodoPagoIcon = 'fab fa-paypal';
            metodoPagoText = 'PayPal';
            metodoPagoClass = 'payment-method-paypal';
          } else if (metodoPago === 'efectivo') {
            metodoPagoIcon = 'fa-money-bill-wave';
            metodoPagoText = 'Efectivo';
            metodoPagoClass = 'payment-method-efectivo';
          } else if (metodoPago === 'transferencia') {
            metodoPagoIcon = 'fa-university';
            metodoPagoText = 'Transferencia';
            metodoPagoClass = 'payment-method-transferencia';
          }
          
          return `
            <tr>
              <td><strong>#${pedido.id}</strong></td>
              <td>
                <div>
                  <strong>${pedido.nombre_completo || 'N/A'}</strong><br>
                  <small style="color: #666;">${pedido.email || 'N/A'}</small>
                </div>
              </td>
              <td>${hora}</td>
              <td>${pedido.items_count || 0}</td>
              <td><strong>$${Number(pedido.total || 0).toFixed(2)}</strong></td>
              <td>
                <span class="status-badge ${estadoClass}">${pedido.estado || 'N/A'}</span>
              </td>
              <td>
                <span class="payment-method-badge ${metodoPagoClass}">
                  <i class="fas ${metodoPagoIcon}"></i>
                  <span>${metodoPagoText}</span>
                </span>
              </td>
            </tr>
          `;
        }).join('');
      }

      (window as any).loadCorteDiario = loadCorteDiario;

      (window as any).imprimirCorteDiario = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          showMessage('No se pudo abrir la ventana de impresión. Por favor, permite las ventanas emergentes.', 'error');
          return;
        }

        const fechaInput = document.getElementById('corteFecha') as HTMLInputElement;
        const fecha = fechaInput?.value || new Date().toISOString().split('T')[0];
        const fechaFormateada = new Date(fecha).toLocaleDateString('es-ES', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });

        const resumen = {
          totalPedidos: document.getElementById('corteTotalPedidos')?.textContent || '0',
          ventasTotales: document.getElementById('corteVentasTotales')?.textContent || '$0.00',
          clientesUnicos: document.getElementById('corteClientesUnicos')?.textContent || '0',
          ticketPromedio: document.getElementById('corteTicketPromedio')?.textContent || '$0.00'
        };

        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Corte Diario - ${fecha}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
              .resumen { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
              .resumen-item { padding: 15px; background: #f5f5f5; border-radius: 5px; }
              .resumen-item h3 { margin: 0 0 5px 0; color: #667eea; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
              th { background: #667eea; color: white; }
              .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <h1>Corte Diario de Ventas</h1>
            <p><strong>Fecha:</strong> ${fechaFormateada}</p>
            
            <div class="resumen">
              <div class="resumen-item">
                <h3>Total de Pedidos</h3>
                <p style="font-size: 24px; font-weight: bold;">${resumen.totalPedidos}</p>
              </div>
              <div class="resumen-item">
                <h3>Ventas Totales</h3>
                <p style="font-size: 24px; font-weight: bold;">${resumen.ventasTotales}</p>
              </div>
              <div class="resumen-item">
                <h3>Clientes Únicos</h3>
                <p style="font-size: 24px; font-weight: bold;">${resumen.clientesUnicos}</p>
              </div>
              <div class="resumen-item">
                <h3>Ticket Promedio</h3>
                <p style="font-size: 24px; font-weight: bold;">${resumen.ticketPromedio}</p>
              </div>
            </div>

            <h2>Pedidos del Día</h2>
            ${document.getElementById('cortePedidosTableBody')?.innerHTML || '<p>No hay pedidos</p>'}

            <div class="footer">
              <p>Generado el ${new Date().toLocaleString('es-ES')}</p>
            </div>
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      };

      // Configurar sistemas al cargar el panel
      if (self.currentUser?.rol === 'admin') {
        self.databaseService.setupNotifications().subscribe({
          next: () => console.log('Sistema de notificaciones configurado'),
          error: (err: any) => console.warn('Error al configurar notificaciones:', err)
        });
        self.databaseService.setupDiscounts().subscribe({
          next: () => console.log('Sistema de descuentos configurado'),
          error: (err: any) => console.warn('Error al configurar descuentos:', err)
        });
      }

      // Inicialización
      setupSignupForm();
      setupPasswordToggles();
      updateCartBadges();
      updatePointsDisplay();
      
      // Asegurar que siempre se abra en login al inicio
      // Ocultar todas las vistas primero
      Object.values(views).forEach((v: any) => {
        if (v && v.classList) {
          v.classList.remove('active');
          v.style.display = 'none';
        }
      });
      
      // Mostrar solo la vista de login
      if (views.login) {
        views.login.style.display = 'block';
        views.login.classList.add('active');
      showView(views.login);
      } else {
        const loginView = document.getElementById('loginView');
        if (loginView) {
          (loginView as HTMLElement).style.display = 'block';
          loginView.classList.add('active');
        }
      }
    }, 100);
  }

  // Métodos públicos para el componente del menú
  getCartCount(): number {
    if (typeof window === 'undefined') return 0;
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    return cart.reduce((total: number, item: any) => total + (item.quantity || 1), 0);
  }

  getFavoritesCount(): number {
    if (typeof window === 'undefined') return 0;
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    return favorites.length;
  }

  getNotificationsCount(): number {
    if (typeof window === 'undefined') return 0;
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    return notifications.filter((n: any) => n.unread).length;
  }

  // Métodos de navegación del menú
  onOrderDelivery() {
    if (typeof window === 'undefined') return;
    console.log('🚚 onOrderDelivery llamado');
    
    // Obtener carrito desde localStorage
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    if (cart.length > 0) {
      // Si hay items en el carrito, ir directo al carrito con delivery seleccionado
      const cartView = document.getElementById('cartView');
      if (cartView) {
        // Ocultar todas las vistas
        document.querySelectorAll('.view').forEach((v: any) => {
          if (v && v.classList) {
            v.classList.remove('active');
            v.style.display = 'none';
          }
        });
        // Mostrar carrito
        cartView.classList.add('active');
        cartView.style.display = 'block';
        
        // Cargar carrito si la función está disponible
        if (this.renderCartFn) {
          this.renderCartFn();
        }
        
    setTimeout(() => {
          const deliveryOption = document.getElementById('deliveryOption') as HTMLInputElement;
          if (deliveryOption) {
            deliveryOption.checked = true;
            deliveryOption.dispatchEvent(new Event('change'));
      }
    }, 100);
      }
    } else {
      // Si no hay items, ir al catálogo
      const catalogView = document.getElementById('catalogView');
      if (catalogView) {
        // Ocultar todas las vistas
        document.querySelectorAll('.view').forEach((v: any) => {
          if (v && v.classList) {
            v.classList.remove('active');
            v.style.display = 'none';
          }
        });
        // Mostrar catálogo
        catalogView.classList.add('active');
        catalogView.style.display = 'block';
        
        if (this.generateBeerCatalogFn) {
          this.generateBeerCatalogFn();
        }
        this.showMessage('Selecciona tus cervezas favoritas para ordenar a domicilio 🍺', 'info');
      }
    }
  }

  onShowCatalog() {
    console.log('🔥🔥🔥 onShowCatalog INICIADO 🔥🔥🔥');
    if (typeof window === 'undefined') {
      console.log('❌ window es undefined');
      return;
    }
    console.log('📦 onShowCatalog llamado');
    
    try {
      const catalogView = document.getElementById('catalogView');
      const dashboardView = document.getElementById('dashboardView');
      
      if (!catalogView) {
        console.error('❌ catalogView no encontrado');
        setTimeout(() => this.onShowCatalog(), 100);
        return;
      }
      
      console.log('✅ catalogView encontrado, ocultando dashboard y mostrando catálogo...');
      
      // Ocultar todas las vistas (remover clase active y estilos inline)
      document.querySelectorAll('.view').forEach((v: any) => {
        if (v && v.classList) {
          v.classList.remove('active');
          // Remover estilos inline que puedan estar forzando la visibilidad
          if (v.style) {
            v.style.display = 'none';
          }
        }
      });
      
      // Ocultar dashboard específicamente (asegurarse de que esté oculto)
      if (dashboardView) {
        dashboardView.classList.remove('active');
        if (dashboardView.style) {
          dashboardView.style.display = 'none';
        }
        console.log('✅ Dashboard ocultado');
      }
      
      // Mostrar catálogo (agregar clase active y remover estilos inline)
      catalogView.classList.add('active');
      if (catalogView.style) {
        catalogView.style.display = '';
      }
      
      // Verificar que la vista esté visible
      const isVisible = catalogView.classList.contains('active');
      const computedDisplay = window.getComputedStyle(catalogView).display;
      console.log('✅ Vista de catálogo:', { 
        active: isVisible, 
        display: computedDisplay,
        dashboardVisible: dashboardView ? window.getComputedStyle(dashboardView).display : 'N/A'
      });
      
      // Forzar scroll al inicio
    setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
      
      // Cargar catálogo si la función está disponible
      if (this.generateBeerCatalogFn) {
        console.log('✅ Cargando catálogo con función guardada');
        this.generateBeerCatalogFn();
      } else {
        console.log('⚠️ Función no disponible, cargando directamente desde API');
        // Cargar catálogo directamente desde la API
        this.databaseService.getCervezas().subscribe({
          next: (cervezas: any[]) => {
            const beerGrid = document.querySelector('.beer-grid');
            if (beerGrid) {
              const beerData = cervezas.map((c: any) => ({
                id: c.id,
                name: c.nombre,
                style: c.estilo,
                description: c.descripcion || '',
                price: Number(c.precio),
                points: c.puntos_ganados ?? Math.floor((Number(c.precio) || 0) * 1),
                image: c.imagen_url || 'https://via.placeholder.com/280x200/EEE/333?text=Cerveza'
              }));
              
              beerGrid.innerHTML = beerData.map(beer => `
                <div class="beer-card">
                  <button class="favorite-btn" onclick="toggleFavorite(${beer.id})" style="position: absolute; top: 15px; right: 15px; background: rgba(0,0,0,0.6); border: none; color: #fff; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; z-index: 10;">
                    <i class="fas fa-heart"></i>
                  </button>
                  <div class="beer-image-container">
                    <img src="${beer.image}" alt="${beer.name}" class="beer-image" loading="lazy" onerror="this.src='https://via.placeholder.com/280x200/EEE/333?text=Cerveza'">
                  </div>
                  <div class="beer-info">
                    <h3 class="beer-name">${beer.name}</h3>
                    <p class="beer-style">${beer.style}</p>
                    <p class="beer-description">${beer.description}</p>
                    <p class="beer-points">+${beer.points} CervezaPoints</p>
                    <p class="beer-price">$${beer.price.toFixed(2)}</p>
                    <button class="add-to-cart" onclick="addToCart(${beer.id})" data-beer-id="${beer.id}">
                      <span class="shimmer"></span>
                      <i class="fas fa-shopping-cart"></i>
                      <span>Añadir al Carrito</span>
                    </button>
                  </div>
                </div>
              `).join('');
            }
          },
          error: (err) => {
            console.error('Error al cargar catálogo:', err);
            const beerGrid = document.querySelector('.beer-grid');
            if (beerGrid) {
              beerGrid.innerHTML = '<p style="text-align:center; padding: 40px; color: #e74c3c;">No se pudo cargar el catálogo. Por favor, intenta de nuevo.</p>';
            }
          }
        });
      }
    } catch (error) {
      console.error('❌ Error en onShowCatalog:', error);
    }
  }

  onShowCart() {
    console.log('🔥🔥🔥 onShowCart INICIADO 🔥🔥🔥');
    if (typeof window === 'undefined') {
      console.log('❌ window es undefined');
      return;
    }
    console.log('🛒 onShowCart llamado');
    
    try {
      const cartView = document.getElementById('cartView');
      const dashboardView = document.getElementById('dashboardView');
      
      if (!cartView) {
        console.error('❌ cartView no encontrado');
        setTimeout(() => this.onShowCart(), 100);
        return;
      }
      
      console.log('✅ cartView encontrado, ocultando dashboard y mostrando carrito...');
      
      // Ocultar todas las vistas (remover clase active y estilos inline)
      document.querySelectorAll('.view').forEach((v: any) => {
        if (v && v.classList) {
          v.classList.remove('active');
          // Remover estilos inline que puedan estar forzando la visibilidad
          if (v.style) {
            v.style.display = 'none';
          }
        }
      });
      
      // Ocultar dashboard específicamente (asegurarse de que esté oculto)
      if (dashboardView) {
        dashboardView.classList.remove('active');
        if (dashboardView.style) {
          dashboardView.style.display = 'none';
        }
        console.log('✅ Dashboard ocultado');
      }
      
      // Mostrar carrito (agregar clase active y remover estilos inline)
      cartView.classList.add('active');
      if (cartView.style) {
        cartView.style.display = '';
      }
      
      // Verificar que la vista esté visible
      const isVisible = cartView.classList.contains('active');
      const computedDisplay = window.getComputedStyle(cartView).display;
      console.log('✅ Vista de carrito:', { 
        active: isVisible, 
        display: computedDisplay,
        dashboardVisible: dashboardView ? window.getComputedStyle(dashboardView).display : 'N/A'
      });
      
      // Forzar scroll al inicio
    setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
      
      // Cargar carrito si la función está disponible
      if (this.renderCartFn) {
        console.log('✅ Cargando carrito con función guardada');
        this.renderCartFn();
      } else {
        console.log('⚠️ Función no disponible, cargando carrito desde localStorage');
        // Cargar carrito directamente desde localStorage
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const cartItemsContainer = document.querySelector('.cart-items');
        const cartSummary = document.querySelector('.cart-summary');
        
        if (cartItemsContainer) {
          if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
              <div style="text-align: center; padding: 60px 20px; color: #bdc3c7;">
                <i class="fas fa-shopping-cart" style="font-size: 64px; margin-bottom: 20px; color: #fdbb2d; opacity: 0.5;"></i>
                <h3 style="font-size: 24px; margin-bottom: 12px; color: #fdbb2d;">Tu carrito está vacío</h3>
                <p style="font-size: 16px; opacity: 0.8;">Agrega productos desde el catálogo</p>
                <button onclick="window.onShowCatalog()" style="margin-top: 20px; padding: 12px 24px; background: linear-gradient(145deg, #fdbb2d, #f9a825); color: #1a1a1a; border: none; border-radius: 8px; font-weight: 700; cursor: pointer;">
                  <i class="fas fa-arrow-left"></i> Ver Catálogo
                </button>
              </div>
            `;
          } else {
            // Renderizar items del carrito
            let total = 0;
              cartItemsContainer.innerHTML = cart.map((item: any, index: number) => {
              const itemTotal = (item.price || 0) * (item.quantity || 1);
              total += itemTotal;
              const itemId = item.id || item.cartItemId || index;
              return `
                <div class="cart-item" data-index="${index}">
                  <div class="cart-item-info">
                    <h4>${item.name || 'Producto'}</h4>
                    <p>$${(item.price || 0).toFixed(2)} c/u</p>
                  </div>
                  <div class="cart-item-controls">
                    <button onclick="updateQuantity(${itemId}, ${(item.quantity || 1) - 1})">-</button>
                    <span>${item.quantity || 1}</span>
                    <button onclick="updateQuantity(${itemId}, ${(item.quantity || 1) + 1})">+</button>
                    <button onclick="removeFromCart(${itemId})" class="remove-btn">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                  <div class="cart-item-total">
                    $${itemTotal.toFixed(2)}
                  </div>
                </div>
              `;
            }).join('');
            
            // Actualizar resumen
            if (cartSummary) {
              const subtotalEl = cartSummary.querySelector('.subtotal-amount');
              const totalEl = cartSummary.querySelector('.total-amount');
              if (subtotalEl) subtotalEl.textContent = `$${total.toFixed(2)}`;
              if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Error en onShowCart:', error);
    }
  }

  onShowOrders() {
    console.log('🔥🔥🔥 onShowOrders INICIADO 🔥🔥🔥');
    if (typeof window === 'undefined') {
      console.log('❌ window es undefined');
      return;
    }
    console.log('📋 onShowOrders llamado');
    
    try {
      const ordersView = document.getElementById('ordersView');
      const dashboardView = document.getElementById('dashboardView');
      
      if (!ordersView) {
        console.error('❌ ordersView no encontrado');
        setTimeout(() => this.onShowOrders(), 100);
        return;
      }
      
      console.log('✅ ordersView encontrado, ocultando dashboard y mostrando pedidos...');
      
      // Ocultar todas las vistas (remover clase active y estilos inline)
      document.querySelectorAll('.view').forEach((v: any) => {
        if (v && v.classList) {
          v.classList.remove('active');
          // Remover estilos inline que puedan estar forzando la visibilidad
          if (v.style) {
            v.style.display = 'none';
          }
        }
      });
      
      // Ocultar dashboard específicamente (asegurarse de que esté oculto)
      if (dashboardView) {
        dashboardView.classList.remove('active');
        if (dashboardView.style) {
          dashboardView.style.display = 'none';
        }
        console.log('✅ Dashboard ocultado');
      }
      
      // Mostrar pedidos (agregar clase active y remover estilos inline)
      ordersView.classList.add('active');
      if (ordersView.style) {
        ordersView.style.display = '';
      }
      
      // Verificar que la vista esté visible
      const isVisible = ordersView.classList.contains('active');
      const computedDisplay = window.getComputedStyle(ordersView).display;
      console.log('✅ Vista de pedidos:', { 
        active: isVisible, 
        display: computedDisplay,
        dashboardVisible: dashboardView ? window.getComputedStyle(dashboardView).display : 'N/A'
      });
      
      // Forzar scroll al inicio
    setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
      
      // Cargar pedidos si la función está disponible
      if (this.generateOrdersListFn) {
        console.log('✅ Cargando pedidos con función guardada');
        this.generateOrdersListFn();
      } else {
        console.log('⚠️ Función no disponible');
      }
    } catch (error) {
      console.error('❌ Error en onShowOrders:', error);
    }
  }

  onShowProfile() {
    if (typeof window === 'undefined') return;
    console.log('👤 onShowProfile llamado');
    
    const profileView = document.getElementById('profileView');
    if (profileView) {
      // Ocultar todas las vistas
      document.querySelectorAll('.view').forEach((v: any) => {
        if (v && v.classList) {
          v.classList.remove('active');
          v.style.display = 'none';
        }
      });
      // Mostrar perfil
      profileView.classList.add('active');
      profileView.style.display = 'block';
    } else {
      setTimeout(() => this.onShowProfile(), 100);
    }
  }

  onShowFavorites() {
    if (typeof window === 'undefined') return;
    console.log('❤️ onShowFavorites llamado');
    
    const favoritesView = document.getElementById('favoritesView');
    if (favoritesView) {
      // Ocultar todas las vistas
      document.querySelectorAll('.view').forEach((v: any) => {
        if (v && v.classList) {
          v.classList.remove('active');
          v.style.display = 'none';
        }
      });
      // Mostrar favoritos
      favoritesView.classList.add('active');
      favoritesView.style.display = 'block';
      
      // Cargar favoritos si la función está disponible
      if (this.renderFavoritesFn) {
        this.renderFavoritesFn();
      }
    } else {
      setTimeout(() => this.onShowFavorites(), 100);
    }
  }

  onShowPointsHistory() {
    if (typeof window === 'undefined') return;
    if (!this.currentUser) {
      console.error('No hay usuario autenticado');
      return;
    }

    const now = Date.now();
    if (this.pointsHistoryCache && (now - this.pointsHistoryCacheTimestamp) < this.cacheTimeout) {
      // Usar datos de la caché
      console.log('Cargando historial de puntos desde caché.');
      this.renderPointsHistory(this.pointsHistoryCache);
    } else {
      // Hacer petición y actualizar caché
      this.databaseService.getTransaccionesPuntos(this.currentUser.id!).subscribe({
        next: (transacciones: any[]) => {
          this.pointsHistoryCache = transacciones;
          this.pointsHistoryCacheTimestamp = now;
          console.log('Historial de puntos cargado y cacheado.');
          this.renderPointsHistory(transacciones);
        },
        error: (err) => {
          console.error('Error al obtener historial de puntos:', err);
          this.showMessage('Error al cargar historial de puntos.', 'error');
        }
      });
    }
  }

  onShowAddresses() {
    if (typeof window === 'undefined') return;
    console.log('📍 onShowAddresses llamado');
    
    const addressesView = document.getElementById('addressesView');
    if (addressesView) {
      // Ocultar todas las vistas
      document.querySelectorAll('.view').forEach((v: any) => {
        if (v && v.classList) {
          v.classList.remove('active');
          v.style.display = 'none';
        }
      });
      // Mostrar direcciones
      addressesView.classList.add('active');
      addressesView.style.display = 'block';
      
      // Cargar direcciones si la función está disponible
      if (this.renderAddressesFn) {
        this.renderAddressesFn();
      }
    } else {
      setTimeout(() => this.onShowAddresses(), 100);
    }
  }

  onShowNotifications() {
    if (typeof window === 'undefined') return;
    console.log('🔔 onShowNotifications llamado');
    
    const notificationsView = document.getElementById('notificationsView');
    if (notificationsView) {
      // Ocultar todas las vistas
      document.querySelectorAll('.view').forEach((v: any) => {
        if (v && v.classList) {
          v.classList.remove('active');
          v.style.display = 'none';
        }
      });
      // Mostrar notificaciones
      notificationsView.classList.add('active');
      notificationsView.style.display = 'block';
      
      // Cargar notificaciones si la función está disponible
      if (this.renderNotificationsFn) {
        this.renderNotificationsFn();
      }
    } else {
      setTimeout(() => this.onShowNotifications(), 100);
    }
  }

  onShowHelp() {
    if (typeof window === 'undefined') return;
    
      const helpHtml = `
        <div style="padding: 30px; max-width: 700px; margin: 0 auto; text-align: left;">
          <h2 style="color: #fdbb2d; margin-bottom: 25px;">
            <i class="fas fa-question-circle"></i> Ayuda y Soporte
          </h2>
          <div style="margin-bottom: 20px;">
            <h3 style="color: #3498db; margin-bottom: 10px;">
              <i class="fas fa-phone"></i> Contacto
            </h3>
            <p>📞 Teléfono: +52 123 456 7890</p>
            <p>📧 Email: soporte@cervezapremium.com</p>
            <p>💬 WhatsApp: +52 123 456 7890</p>
          </div>
          <div style="margin-bottom: 20px;">
            <h3 style="color: #3498db; margin-bottom: 10px;">
              <i class="fas fa-clock"></i> Horarios
            </h3>
            <p>Lunes a Viernes: 9:00 AM - 8:00 PM</p>
            <p>Sábados: 10:00 AM - 6:00 PM</p>
            <p>Domingos: 10:00 AM - 4:00 PM</p>
          </div>
          <div>
            <h3 style="color: #3498db; margin-bottom: 10px;">
              <i class="fas fa-question"></i> Preguntas Frecuentes
            </h3>
            <p><strong>¿Cómo funciona el sistema de puntos?</strong><br>
            Ganas 10 puntos por cada $100 gastados. Úsalos para obtener descuentos.</p>
            <p><strong>¿Cuál es el tiempo de entrega?</strong><br>
            De 24 a 48 horas en la ciudad, 3-5 días en otras áreas.</p>
            <p><strong>¿Puedo cancelar mi pedido?</strong><br>
            Sí, dentro de las primeras 2 horas después de realizado.</p>
          </div>
        </div>
      `;
      
      // Usar autoClose: false para que el usuario pueda cerrarlo manualmente con el botón
      if (this.showMessageFn) {
        this.showMessageFn(helpHtml, 'info', false);
      } else {
        this.showMessage(helpHtml, 'info', false);
      }
      
      // Asegurar que el botón de cierre funcione después de mostrar el mensaje
    setTimeout(() => {
        const closeMessageBtn = document.getElementById('closeMessage');
        if (closeMessageBtn) {
          // Remover listeners anteriores para evitar duplicados
          const newCloseBtn = closeMessageBtn.cloneNode(true);
          closeMessageBtn.parentNode?.replaceChild(newCloseBtn, closeMessageBtn);
          
          // Agregar listener al nuevo botón
          (newCloseBtn as HTMLElement).addEventListener('click', () => {
            const messagePopup = document.getElementById('messagePopup');
            if (messagePopup) {
              (messagePopup as HTMLElement).style.display = 'none';
              messagePopup.classList.remove('show');
              clearTimeout((window as any).messageTimeout);
            }
          });
        }
      }, 150);
  }

  onShowSettings() {
    if (typeof window === 'undefined') return;
    console.log('⚙️ onShowSettings llamado');
    
    const settingsView = document.getElementById('settingsView');
    if (settingsView) {
      // Ocultar todas las vistas
      document.querySelectorAll('.view').forEach((v: any) => {
        if (v && v.classList) {
          v.classList.remove('active');
          v.style.display = 'none';
        }
      });
      // Mostrar configuración
      settingsView.classList.add('active');
      settingsView.style.display = 'block';
      
      // Cargar configuración si la función está disponible
      if (this.renderSettingsFn) {
        this.renderSettingsFn();
      }
    } else {
      setTimeout(() => this.onShowSettings(), 100);
    }
  }

  onShowPromotions() {
    if (typeof window === 'undefined') return;
    
      const promoHtml = `
        <div style="padding: 30px; max-width: 800px; margin: 0 auto;">
          <h2 style="color: #fdbb2d; margin-bottom: 25px;">
            <i class="fas fa-gift"></i> Promociones Activas
          </h2>
          <div style="background: linear-gradient(145deg, #232b38, #1a1a1a); padding: 25px; border-radius: 15px; margin-bottom: 20px; border: 2px solid #e91e63;">
            <h3 style="color: #e91e63; margin-bottom: 10px;">🎉 BIENVENIDA15</h3>
            <p style="font-size: 18px; margin-bottom: 10px;">15% de descuento en tu primera compra</p>
            <p style="opacity: 0.8;">Válido hasta fin de mes</p>
          </div>
          <div style="background: linear-gradient(145deg, #232b38, #1a1a1a); padding: 25px; border-radius: 15px; margin-bottom: 20px; border: 2px solid #f39c12;">
            <h3 style="color: #f39c12; margin-bottom: 10px;">⭐ PUNTOS2X</h3>
            <p style="font-size: 18px; margin-bottom: 10px;">Gana el doble de puntos en compras mayores a $500</p>
            <p style="opacity: 0.8;">Válido los fines de semana</p>
          </div>
          <div style="background: linear-gradient(145deg, #232b38, #1a1a1a); padding: 25px; border-radius: 15px; border: 2px solid #27ae60;">
            <h3 style="color: #27ae60; margin-bottom: 10px;">🚚 ENVIOGRATIS</h3>
            <p style="font-size: 18px; margin-bottom: 10px;">Envío gratuito en compras mayores a $300</p>
            <p style="opacity: 0.8;">Siempre activo</p>
          </div>
        </div>
      `;
      
      // Usar autoClose: false para que el usuario pueda cerrarlo manualmente con el botón
      if (this.showMessageFn) {
        this.showMessageFn(promoHtml, 'info', false);
      } else {
        this.showMessage(promoHtml, 'info', false);
      }
      
      // Asegurar que el botón de cierre funcione después de mostrar el mensaje
    setTimeout(() => {
        const closeMessageBtn = document.getElementById('closeMessage');
        if (closeMessageBtn) {
          // Remover listeners anteriores para evitar duplicados
          const newCloseBtn = closeMessageBtn.cloneNode(true);
          closeMessageBtn.parentNode?.replaceChild(newCloseBtn, closeMessageBtn);
          
          // Agregar listener al nuevo botón
          (newCloseBtn as HTMLElement).addEventListener('click', () => {
            const messagePopup = document.getElementById('messagePopup');
            if (messagePopup) {
              (messagePopup as HTMLElement).style.display = 'none';
              messagePopup.classList.remove('show');
              clearTimeout((window as any).messageTimeout);
            }
          });
        }
      }, 150);
  }

  onShowRecommendations() {
    if (typeof window === 'undefined') return;
    console.log('✨ onShowRecommendations llamado');
    
    const recommendationsView = document.getElementById('recommendationsView');
    if (recommendationsView) {
      // Ocultar todas las vistas
      document.querySelectorAll('.view').forEach((v: any) => {
        if (v && v.classList) {
          v.classList.remove('active');
          v.style.display = 'none';
        }
      });
      // Mostrar recomendaciones
      recommendationsView.classList.add('active');
      recommendationsView.style.display = 'block';
      
      // Cargar recomendaciones si la función está disponible
      if (this.renderRecommendationsFn) {
        this.renderRecommendationsFn();
      }
    } else {
      setTimeout(() => this.onShowRecommendations(), 100);
    }
  }

  onShowAdminPanel() {
    if (typeof window === 'undefined') return;
    console.log('👨‍💼 onShowAdminPanel llamado');
    
    const adminView = document.getElementById('adminDashboardView');
    if (adminView) {
      // Ocultar todas las vistas
      document.querySelectorAll('.view').forEach((v: any) => {
        if (v && v.classList) {
          v.classList.remove('active');
          v.style.display = 'none';
        }
      });
      // Mostrar admin dashboard
      adminView.classList.add('active');
      adminView.style.display = 'block';
      
      // Inicializar el panel mostrando el dashboard por defecto
    setTimeout(() => {
        // Asegurar que la sección de dashboard esté visible
        const dashboardSection = document.getElementById('adminDashboardSection');
        if (dashboardSection) {
          // Ocultar todas las secciones primero
          document.querySelectorAll('.admin-section').forEach(sec => {
            sec.classList.remove('active');
            (sec as HTMLElement).style.display = 'none';
          });
          
          // Mostrar dashboard
          dashboardSection.classList.add('active');
          (dashboardSection as HTMLElement).style.display = 'block';
          
          // Activar la tarjeta de dashboard
          document.querySelectorAll('.admin-nav-card').forEach(card => {
            card.classList.remove('active');
          });
          const dashboardCard = document.querySelector('[onclick*="showAdminSection(\'dashboard\')"]') as HTMLElement;
          if (dashboardCard) {
            dashboardCard.classList.add('active');
          }
          
          // Cargar estadísticas
          if (typeof (window as any).loadAdminStats === 'function') {
            (window as any).loadAdminStats();
          } else if (typeof (window as any).showAdminSection === 'function') {
            (window as any).showAdminSection('dashboard');
          }
      }
    }, 100);
    } else {
      setTimeout(() => this.onShowAdminPanel(), 100);
    }
  }

  onLogout() {
    if (typeof window === 'undefined') return;
    console.log('🚪 onLogout llamado');
    
    // Limpiar datos de sesión primero
    this.databaseService.logout();
    this.currentUser = null;
    
    // Limpiar localStorage
    localStorage.removeItem('cart');
    localStorage.removeItem('favorites');
    
    // Mostrar mensaje
    this.showMessage('Sesión cerrada exitosamente', 'info');
    
    // Redirigir a login
    setTimeout(() => {
      const loginView = document.getElementById('loginView');
      if (loginView) {
        // Ocultar todas las vistas
        document.querySelectorAll('.view').forEach((v: any) => {
          if (v && v.classList) {
            v.classList.remove('active');
            v.style.display = 'none';
          }
        });
        // Mostrar login
        loginView.classList.add('active');
        loginView.style.display = 'block';
      }
      this.databaseService.logout();
    }, 1000);
  }

  private configureCheckoutProcess() {
    // Configuración del proceso de checkout
    // Este método puede ser implementado más adelante si es necesario
  }

  // Modal genérico simple para mostrar contenido HTML
  private showModal(contentHtml: string, _title: string, onOpen?: () => void) {
    if (typeof document === 'undefined') {
      return;
    }

    let modal = document.getElementById('genericPointsModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'genericPointsModal';
      modal.className = 'modal';
      modal.style.display = 'flex';
      modal.innerHTML = `<div class="modal-content">${contentHtml}</div>`;
      document.body.appendChild(modal);
    } else {
      modal.innerHTML = `<div class="modal-content">${contentHtml}</div>`;
      modal.style.display = 'flex';
    }

    if (onOpen) {
      onOpen();
    }
  }

  private closeModal() {
    if (typeof document === 'undefined') {
      return;
    }

    const modal = document.getElementById('genericPointsModal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  private renderPointsHistory(transacciones: any[]) {
    if (!this.currentUser) return;

    let html = `
      <div style="padding: 30px; max-width: 900px; margin: 0 auto;">
        <h2 style="color: #fdbb2d; margin-bottom: 20px;">
          <i class="fas fa-star"></i> Historial de Puntos
        </h2>
        <p style="font-size: 18px; margin-bottom: 30px;">
          Puntos actuales: <strong style="color: #fdbb2d;">${this.currentUser.puntos_acumulados}</strong>
        </p>
    `;

    if (transacciones.length === 0) {
      html += '<p style="text-align: center; opacity: 0.7;">No hay transacciones de puntos aún</p>';
    } else {
      html += `
        <div style="max-height: 400px; overflow-y: auto; border: 1px solid #444; border-radius: 8px; background-color: #2a2a2a;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead style="background-color: #333;">
              <tr>
                <th style="padding: 12px 15px; text-align: left; color: #fdbb2d; border-bottom: 1px solid #555;">Fecha</th>
                <th style="padding: 12px 15px; text-align: left; color: #fdbb2d; border-bottom: 1px solid #555;">Tipo</th>
                <th style="padding: 12px 15px; text-align: left; color: #fdbb2d; border-bottom: 1px solid #555;">Cantidad</th>
                <th style="padding: 12px 15px; text-align: left; color: #fdbb2d; border-bottom: 1px solid #555;">Descripción</th>
              </tr>
            </thead>
            <tbody>
      `;

      transacciones.forEach(t => {
        const fecha = new Date(t.fecha_transaccion).toLocaleDateString();
        const tipoClass = t.tipo === 'ganado' ? 'color: #8bc34a;' : 'color: #ff7043;';
        const cantidadSign = t.tipo === 'ganado' ? '+' : '-';
        html += `
          <tr style="border-bottom: 1px solid #3a3a3a;">
            <td style="padding: 10px 15px;">${fecha}</td>
            <td style="padding: 10px 15px;"><span style="${tipoClass}">${t.tipo.charAt(0).toUpperCase() + t.tipo.slice(1)}</span></td>
            <td style="padding: 10px 15px;"><span style="${tipoClass}">${cantidadSign}${t.cantidad}</span></td>
            <td style="padding: 10px 15px;">${t.descripcion}</td>
          </tr>
        `;
      });

      html += `
            </tbody>
          </table>
        </div>
      `;
    }

    html += `
          <button id="closePointsHistoryModal" style="
            background-color: #fdbb2d; color: #1a1a1a; padding: 10px 20px; border-radius: 5px;
            border: none; cursor: pointer; font-size: 16px; margin-top: 30px; width: 100%;
            transition: background-color 0.3s ease;
          ">
            Cerrar
          </button>
        </div>
    `;

    // Muestra el modal con el historial
    this.showModal(html, 'Historial de Puntos', () => {
      document.getElementById('closePointsHistoryModal')?.addEventListener('click', () => {
        this.closeModal();
      });
    });
  }
}