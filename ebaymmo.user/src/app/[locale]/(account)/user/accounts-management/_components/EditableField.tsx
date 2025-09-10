import { PencilIcon } from '@heroicons/react/24/outline';
import Input from '@/components/BaseUI/Input';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface EditableFieldProps {
    label: string;
    value: string | null;
    type?: 'text' | 'password';
    onSave: (newValue: string) => Promise<void>;
    placeholder?: string;
    isPassword?: boolean;
    onSavePassword?: (
        oldPassword: string,
        newPassword: string
    ) => Promise<void>;
}

export default function EditableField({
    label,
    value,
    type = 'text',
    onSave,
    placeholder,
    isPassword = false,
    onSavePassword
}: EditableFieldProps) {
    const t = useTranslations('user.account-management.profile.editableField');
    const [isEditing, setIsEditing] = useState(false);
    const [newValue, setNewValue] = useState('');
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const validatePassword = (password: string): string | null => {
        if (password.length < 8) {
            return t('passwordTooShort');
        }
        if (!/[A-Z]/.test(password)) {
            return t('passwordNeedsUppercase');
        }
        if (!/[0-9]/.test(password)) {
            return t('passwordNeedsNumber');
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            return t('passwordNeedsSpecial') + ' (!@#$%^&*(),.?\":{}|<>)';
        }
        return null;
    };

    const handleSave = async () => {
        if (isPassword && onSavePassword) {
            const passwordValidationError = validatePassword(newPassword);
            if (passwordValidationError) {
                setPasswordError(passwordValidationError);
                return;
            }
            if (newPassword !== confirmPassword) {
                setPasswordError(t('passwordMismatch'));
                return;
            }
            await onSavePassword(oldPassword, newPassword);
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setPasswordError('');
        } else {
            await onSave(newValue);
            setNewValue('');
        }
        setIsEditing(false);
    };

    return (
        <div className="mt-4 flex flex-col gap-[20px]">
            <label className="block text-[18px] font-medium text-gray-700">
                {label}
            </label>
            {isEditing ? (
                <>
                    {isPassword ? (
                        <>
                            <div className="mt-3">
                                <label
                                    htmlFor="oldPassword"
                                    className="block text-gray-700 text-[14px]"
                                >
                                    {t('oldPassword')}
                                </label>
                                <Input
                                    id="oldPassword"
                                    type="password"
                                    className="mt-2 w-full rounded-lg border-gray-300"
                                    placeHolder={t('oldPasswordPlaceholder')}
                                    value={oldPassword}
                                    onChange={(e) =>
                                        setOldPassword(e.target.value)
                                    }
                                />
                            </div>
                            <div className="mt-3">
                                <label
                                    htmlFor="newPassword"
                                    className="block text-gray-700 text-[14px]"
                                >
                                    {t('newPassword')}
                                </label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    className="mt-2 w-full rounded-lg border-gray-300"
                                    placeHolder={t('newPasswordPlaceholder')}
                                    value={newPassword}
                                    onChange={(e) => {
                                        setNewPassword(e.target.value);
                                        setPasswordError('');
                                    }}
                                />
                            </div>
                            <div className="mt-3">
                                <label
                                    htmlFor="confirmPassword"
                                    className="block text-gray-700 text-[14px]"
                                >
                                    {t('confirmPassword')}
                                </label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    className="mt-2 w-full rounded-lg border-gray-300"
                                    placeHolder={t(
                                        'confirmPasswordPlaceholder'
                                    )}
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value);
                                        setPasswordError('');
                                    }}
                                />
                            </div>
                            {passwordError && (
                                <p className="text-red-500 text-sm mt-1">
                                    {passwordError}
                                </p>
                            )}
                        </>
                    ) : (
                        <Input
                            className="mt-1 w-full rounded-lg border-gray-300"
                            placeholder={placeholder}
                            value={newValue}
                            onChange={(e) => setNewValue(e.target.value)}
                        />
                    )}
                    <div className="mt-2 flex justify-end gap-4">
                        <button
                            onClick={() => {
                                setIsEditing(false);
                                setPasswordError('');
                                setOldPassword('');
                                setNewPassword('');
                                setConfirmPassword('');
                            }}
                            className="text-red-500 hover:text-red-600"
                        >
                            {t('cancel')}
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-1 bg-green-500 text-white rounded-full hover:bg-green-600"
                        >
                            {t('confirm')}
                        </button>
                    </div>
                </>
            ) : (
                <div className="mt-1 flex justify-between items-center mb-4">
                    <p className="text-[18px] text-gray-600">
                        {isPassword
                            ? '••••••••••••••••••'
                            : value ||
                              t('noValue', { field: label.toLowerCase() })}
                    </p>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <PencilIcon className="h-5 w-5" />
                    </button>
                </div>
            )}
        </div>
    );
}
