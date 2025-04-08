import React from 'react'
import Navbar from './components/navbar'
import DocumentMeta from 'react-document-meta';
import Footer from './components/footer';
const TOS = () => {
    const meta = {
        title: 'Terms of Service',
        description: 'Terms of Service',
        // canonical: 'https://gatorpool.com/tos',
        meta: {
            charset: 'utf-8',
            name: {
                keywords: 'GatorPool, UF, Rideshare, Rides, Pool, Carpool, Uber, Lyft',
            },
        },
    };

    return (
        <div className="flex flex-col min-h-screen w-full overflow-y-auto bg-white dark:bg-[#0c0c0c]">
            <Navbar />
            <DocumentMeta {...meta} />
            <div className="flex flex-col items-center h-full w-full mt-32 px-6 max-w-4xl mx-auto">
                <h1 className="text-4xl text-center text-black dark:text-white font-RobotoBold mb-8">
                    Terms of Service
                </h1>
                
                <div className="text-left w-full space-y-6 text-black dark:text-white font-RobotoRegular">
                    <section>
                        <h2 className="text-2xl font-RobotoBold mb-4">1. Acceptance of Terms</h2>
                        <p>By using GatorPool, you agree to these Terms of Service. If you do not agree, please do not use our service.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-RobotoBold mb-4">2. Eligibility</h2>
                        <p>You must be a current university student with a valid .edu email address to use GatorPool. You must be at least 18 years old.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-RobotoBold mb-4">3. User Responsibilities</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Provide accurate information about yourself and your vehicle (if driving)</li>
                            <li>Treat all users with respect and follow university conduct policies</li>
                            <li>Maintain appropriate insurance coverage if you are a driver</li>
                            <li>Report any safety concerns or incidents immediately</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-RobotoBold mb-4">4. Safety Guidelines</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Always wear seatbelts</li>
                            <li>No alcohol or drug use while using the service</li>
                            <li>Follow all traffic laws and regulations</li>
                            <li>Maintain a safe and clean vehicle if you are a driver</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-RobotoBold mb-4">5. Payments</h2>
                        <p>Payments are handled directly between riders and drivers. GatorPool is not responsible for payment disputes. We recommend using secure payment methods and keeping records of all transactions.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-RobotoBold mb-4">6. Liability</h2>
                        <p>GatorPool is a platform connecting riders and drivers. We are not responsible for any accidents, injuries, or damages that occur during rides. Users are responsible for their own safety and the safety of others.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-RobotoBold mb-4">7. Privacy</h2>
                        <p>We collect and use your information as described in our Privacy Policy. We will never share your personal information without your consent, except as required by law.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-RobotoBold mb-4">8. Termination</h2>
                        <p>We reserve the right to terminate or suspend your account if you violate these terms or engage in unsafe or inappropriate behavior.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-RobotoBold mb-4">9. Changes to Terms</h2>
                        <p>We may update these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-RobotoBold mb-4">10. Contact</h2>
                        <p>For questions about these terms, please contact us at support@gatorpool.com</p>
                    </section>
                </div>
            </div>

            <Footer />
        </div>
    )
}

export default TOS