import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/toast';
import { AlertCircle, LogIn } from 'lucide-react';
import { useLoginOperatorMutation } from '@/generated/graphql';
import { ApolloError } from '@apollo/client';

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [emailError, setEmailError] = useState('');
    const navigate = useNavigate();

    const accessToken = localStorage.getItem('accessToken');
    console.log(accessToken);
    if (accessToken) {
        window.location.href = '/admin/dashboard';
    }

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    };

    // Call hook at the top level of component
    const [loginOperator] = useLoginOperatorMutation();

    // Validate on input change
    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newEmail = e.target.value;
        setEmail(newEmail);

        if (newEmail && !validateEmail(newEmail)) {
            setEmailError('Email is not valid');
        } else {
            setEmailError('');
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate before submission
        if (!validateEmail(email)) {
            setEmailError('Email is not valid');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Use the mutation function we got from the hook
            const result = await loginOperator({
                variables: {
                    email,
                    password
                }
            });

            // Process the response
            if (result.data?.loginOperator) {
                localStorage.setItem(
                    'accessToken',
                    result.data.loginOperator.accessToken
                );

                localStorage.setItem(
                    'refreshToken',
                    result.data.loginOperator.refreshToken
                );
                toast({
                    title: 'Login successful',
                    description: 'Welcome to the admin panel'
                });

                // Redirect to dashboard
                navigate('/admin/dashboard');
            } else {
                setError('Invalid email or password');
            }
        } catch (err: unknown) {
            // Type check before accessing properties
            if (err instanceof ApolloError) {
                if (err.message.includes('User not found')) {
                    setError('Email is not exist');
                } else if (err.message.includes('password')) {
                    setError('Password is incorrect');
                } else {
                    setError(`Login error: ${err.message}`);
                }
            } else {
                setError('Login error');
            }
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-foreground">
                        SHOP3 ADMIN
                    </h2>
                    <p className="text-muted-foreground mt-2">
                        Log in to access the administration area
                    </p>
                </div>

                <Card>
                    <form onSubmit={handleLogin}>
                        <CardContent className="space-y-4 pt-5">
                            {error && (
                                <div className="bg-red-300 text-red-500 text-sm p-3 rounded-md flex items-center">
                                    <AlertCircle className="h-4 w-4 mr-2" />
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder=""
                                    value={email}
                                    onChange={handleEmailChange}
                                    className={
                                        emailError ? 'border-red-500' : ''
                                    }
                                    required
                                />
                                {emailError && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {emailError}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                    <a
                                        href="#"
                                        className="text-sm text-primary hover:underline"
                                    >
                                        Forgot password?
                                    </a>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    required
                                />
                            </div>
                        </CardContent>

                        <CardFooter>
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={loading}
                                onClick={handleLogin}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center">
                                        <svg
                                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                        Logging in...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center">
                                        <LogIn className="mr-2 h-4 w-4" />
                                        Log In
                                    </span>
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
