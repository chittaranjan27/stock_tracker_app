'use client';

import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import InputField from '@/components/forms/InputField';
import FooterLink from '@/components/forms/FooterLink';
import { signInWithEmail } from '@/lib/actions/auth.actions';
import {useRouter} from "next/navigation";
import { toast } from 'sonner';

const SignIn = () => {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onBlur',
  });

   const onSubmit = async (data: SignInFormData) => {
      try {
        const result = await signInWithEmail(data);
        if(result.sucess) router.push('/')
      } catch (e) {
        console.error(e);
        toast.error('sign ip faild', {
          description: e instanceof Error ? e.message : 'Faild to sign in.'
        })
      }
    }

  return (
    <>
      <h1 className="form-title">Welcome back</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <InputField
          name="email"
          label="Email"
          placeholder="ranjan@example.com"
          register={register}
          error={errors.email}
          validation={{ required: 'Email is required', pattern: /^\w+@\w+\.\w+$/ }}
        />

        <InputField
          name="password"
          label="Password"
          placeholder="Enter your password"
          type="password"
          register={register}
          error={errors.password}
          validation={{ required: 'Password is required', minLength: 8 }}
        />

        <Button type="submit" disabled={isSubmitting} className="gray-btn font-bold w-auto mx-auto block">
          {isSubmitting ? 'Signing In' : 'Sign In'}
        </Button>
        
        <FooterLink text="Don't have an account?" linkText="Create an account" href="/sign-up" />
      </form>
    </>
  );
};
export default SignIn;