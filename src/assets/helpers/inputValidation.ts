export function validateUrl(URL = '') {
    const urlPattern = /^(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9]+(?:\.[a-zA-Z]{2,})+(?:\/.*)?$/;
    return urlPattern.test(URL);
}

export function validateEmail(input = '') {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(input);
}

export function validateFullName(input = '') {
    const fullNamePattern = /^[\p{L}\s']+$/u;
    return fullNamePattern.test(input) && input.length > 2;
}

export function validateLength(input = '', limit = {min: 2, max: 255}) {
    if(input && limit.max > limit.min){
        if(input.length < limit.min){
            return false
        } 
        return input.length < limit.max;

    }
    return null;
}

export function validRequiredFields(requiredFields: string[], payload: any){
    return (requiredFields.filter((item: string) => !payload[item]));
}

export function validatePhoneNumber(input: any) {
    input = input.replaceAll(' ', '');
    var regex = /^(\+\d{1,3})?[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/;
    return (input.length >= 9 && input.length <= 15 && regex.test(input));
}
export function validatePasswordStrength(passwordString: any) {
    let strength = 0;
    if(passwordString){
        // Criteria for password strength
        const hasLowercase = /[a-z]/.test(passwordString);
        const hasUppercase = /[A-Z]/.test(passwordString);
        const hasNumbers = /\d/.test(passwordString);
        const hasSpecialChars = /\W/.test(passwordString);
        const isLongEnough = passwordString.length >= 8;

        // Increase strength for each met criteria
        if (hasLowercase) strength++;
        if (hasUppercase) strength++;
        if (hasNumbers) strength++;
        if (hasSpecialChars) strength++;
        if (isLongEnough) strength++;

        // Classify strength
        if (strength <= 2) {
            return 1;
        } else if (strength <= 4) {
            return 2;
        } else {
            return 3;
        }
    }
    return 0;
}