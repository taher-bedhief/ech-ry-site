import Head from "next/head";
import Link from "next/link";
import SignupForm from "@/components/forms/SignupForm";
import Logo from "@/assets/Logo";

const RegisterPage = () => {
  return (
    <>
      <Head>
        <title>Register | EchRy</title>
        <meta name="description" content="Create your account to start shopping on EchRy." />
      </Head>

      <div className="max-w-xl mx-auto pt-12 pb-20 px-default">
        <h1 className="sr-only">Create your account</h1>

        {/* Logo et texte */}
        <div className="flex flex-col items-center text-center mb-6">
          <Logo />
          <p className="my-3 text-muted">
            By signing up, you agree to our{" "}
            <Link href="/" className="text-primary hover:underline">
              terms & policy
            </Link>
          </p>
        </div>

        {/* Formulaire combiné inscription + confirmation */}
        <SignupForm />

        <div className="flex-1 h-0.5 bg-muted my-6"></div>

        {/* Lien vers login */}
        <p className="text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Login
          </Link>
        </p>
      </div>
    </>
  );
};

export default RegisterPage;
