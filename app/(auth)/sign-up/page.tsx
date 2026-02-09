'use client'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button';
import InputField from '@/components/forms/InputField';
import SelectField from '@/components/forms/SelectField';
import { INVESTMENT_GOALS, PREFERRED_INDUSTRIES, RISK_TOLERANCE_OPTIONS } from '@/lib/constants';
import {CountrySelectField} from "@/components/forms/CountrySelectField";
import FooterLink from '@/components/forms/FooterLink';
import { signUpWithEmail } from '@/lib/actions/auth.actions';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const SignUp = () => {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormData>({
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      country: '',
      investmentGoals: 'Growth',
      riskTolerance: 'Medium',
      preferredIndustry: 'Technology',
    },
    mode: 'onBlur',
  },);
  
  const onSubmit = async (data: SignUpFormData) => {
    try {
      const result = await signUpWithEmail(data);
      if(result.sucess) router.push('/')
    } catch (e) {
      console.error(e);
      toast.error('sign up faild', {
        description: e instanceof Error ? e.message : 'Faild to create an account'
      })
    }
  }
  return (
    <>
      <h1 className='form-title mt-6'>Sign Up & Persnolized</h1>
      <form onSubmit={handleSubmit(onSubmit)} className='space-y-6 w-full'>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <InputField
            name='fullName'
            label='Full Name'
            register={register}
            error={errors.fullName}
            validation={{ required: 'Full Name is required', minLength: 2 }}
            placeholder='Ranjan Dora'
          />

          <InputField
            name='email'
            label='Email'
            register={register}
            placeholder='ranjan@example.com'
            error={errors.email}
            validation={{ required: 'Email is required', pattern: /^\S+@\S+$/i, message: 'Invalid email address' }}
          />

          <div className="sm:col-span-2">
            <InputField
              name='password'
              label='Password'
              type='password'
              placeholder='Enter a Strong password'
              register={register}
              error={errors.password}
              validation={{ required: 'Password is required', minLength: 8 }}
            />
          </div>

          <div className="sm:col-span-2">
            <CountrySelectField
              name= "country"
              label="Country"
              control={control}
              error={errors.country}
              required
            />
          </div>

          <div className="sm:col-span-2">
            <SelectField
              name="inverstmentGoals"
              label="Investment Goals"
              placeholder="Select your investment goals"
              options={INVESTMENT_GOALS}
              control={control}
              error={errors.investmentGoals}
              required
            />
          </div>

          <div className="sm:col-span-2">
            <SelectField
              name="riskTolerance"
              label="Risk Tolerance"
              placeholder="Select your risk level"
              options={RISK_TOLERANCE_OPTIONS}
              control={control}
              error={errors.riskTolerance}
              required
            />
          </div>

          <div className="sm:col-span-2">
            <SelectField
              name="preferredIndustry"
              label="Preferred Industry"
              placeholder="Select your preferred industry"
              options={PREFERRED_INDUSTRIES}
              control={control}
              error={errors.preferredIndustry}
              required
            />
          </div>
        </div>

        <Button
          type='submit'
          disabled={isSubmitting}
          className='gray-btn font-bold w-full sm:w-auto sm:mx-0 mx-auto block'
        >
          {isSubmitting ? 'Creating account' : 'Start Your Inveting Journey'}
        </Button>

        <FooterLink text="Already have an acccount?" linkText="Sign in" href="/sign-in" />
      </form>
    </>
  )
}

export default SignUp
