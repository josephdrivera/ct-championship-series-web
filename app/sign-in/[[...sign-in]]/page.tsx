import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-cream px-6">
      <div className="w-full max-w-md">
        <h1 className="mb-8 text-center font-serif text-3xl font-bold text-dark-green">
          Welcome Back
        </h1>
        <SignIn
          appearance={{
            variables: {
              colorPrimary: "#006747",
              colorBackground: "#FDF8F0",
              colorText: "#001A11",
              colorInputBackground: "#FFFFFF",
              colorInputText: "#001A11",
            },
            elements: {
              footerAction: { display: "none" },
            },
          }}
        />
      </div>
    </main>
  );
}
