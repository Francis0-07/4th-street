const Terms = () => {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base font-semibold text-indigo-600 tracking-wide uppercase">Legal</h2>
          <p className="mt-1 text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Terms of Service
          </p>
          <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500">
            Please read these terms carefully before using our services.
          </p>
        </div>
        <div className="mt-16 prose prose-indigo prose-lg text-gray-500 mx-auto max-w-3xl">
            <h3>1. Introduction</h3>
            <p>
                Welcome to 4th-street. By accessing our website and using our services, you agree to be bound by these Terms of Service and all applicable laws and regulations.
            </p>
            <h3>2. Use of Service</h3>
            <p>
                You agree to use our service only for lawful purposes. You are prohibited from violating any laws, infringing on any intellectual property rights, or engaging in any fraudulent activities.
            </p>
            <h3>3. Product Information</h3>
            <p>
                We strive to display our products as accurately as possible. However, we cannot guarantee that your monitor's display of any color will be accurate.
            </p>
            <h3>4. Limitation of Liability</h3>
            <p>
                4th-street shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.
            </p>
            <h3>5. Changes to Terms</h3>
            <p>
                We reserve the right to modify these terms at any time. Your continued use of the service after any changes constitutes your acceptance of the new terms.
            </p>
        </div>
      </div>
    </div>
  );
};

export default Terms;