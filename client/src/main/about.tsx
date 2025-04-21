import React from "react";
import Navbar from "./components/navbar";
import mustafa from "../assets/images/mustafa.jpeg";
import hector from "../assets/images/hector.jpeg";
import deepak from "../assets/images/deepak.jpeg";
import saeed from "../assets/images/saeed.jpeg";
import { Button } from "@heroui/react";
import { useNavigate } from "react-router-dom";
import DocumentMeta from "react-document-meta";
import Footer from "./components/footer";
const About = () => {
  const meta = {
    title: "About GatorPool",
    description: "About GatorPool",
    canonical: "https://gatorpool.app/about",
    meta: {
      charset: "utf-8",
      name: {
        keywords: "GatorPool, UF, Rideshare, Rides, Pool, Carpool, Uber, Lyft",
      },
    },
  };

  const navigate = useNavigate();

  interface Founder {
    name: string;
    image: string;
    description: string;
    role: string;
  }

  const founders: Founder[] = [
    {
      name: "Mustafa Masody",
      image: mustafa,
      role: "Leader & Full-Stack",
      description: `
            Mustafa is a senior at UF studying Computer Science. He has been programming since the age of 11, beginning with Java.
            Over the years, he has built his credentials and passion within the field, and is now creating impactful SaaS products.
            Mustafa will be joining Uber as a Software Engineer Intern in June 2025.
            `,
    },
    {
      name: "Hector Cruz",
      image: hector,
      role: "Lead Developer",
      description: `
            Hector is a junior at UF studying Computer Science. His idea was what made the project possible, and his contributions
            to the project were immense. Hector will be joining JPMorgan Chase & Co. as a Software Engineer Intern in June 2025.
            `,
    },
    {
      name: "Deepak Guggilam",
      image: deepak,
      role: "Backend & Client Developer",
      description: `
            Deepak is a junior at UF studying Computer Science. He has a passion for building AI projects, and
            leveraging technology to create innovative solutions that enhance people's quality of life.
            Deepak is currently in the Undergraduate Research Program and will be joining Emerge as a Software
            Engineer Intern in May 2025.
            `,
    },
    {
      name: "Saeed Ansari",
      image: saeed,
      role: "Frontend Developer & Project Manager",
      description: `
            Saeed is a junior at UF studying Computer Science. His immense experience, not only in the SWE field,
            but in other crucial areas like project management, has been the backbone of GatorPool. His dedication
            to managing the project has been the reason GatorPool is great. Saeed will be joining Verizon as a Software 
            Engineer Intern in June 2025.
            `,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen w-full overflow-y-auto bg-white dark:bg-[#0c0c0c]">
      <Navbar />
      <DocumentMeta {...meta} />
      <div className="flex flex-col items-center h-full w-full mt-32 px-6">
        <h1 className="text-4xl text-center text-black dark:text-white font-RobotoBold">
          About GatorPool
        </h1>
        <p className="text-lg mt-3 text-center max-w-screen-lg text-black dark:text-white font-RobotoRegular">
          GatorPool began as a semester project for the Intro to SWE course at
          the University of Florida (go gators!). We were given the task of
          creating an application that provides assistance to underlying causes
          of mental health issues in early college students. One of the big
          hassles for college students is finding rides to and from home during
          weekends and breaks. One of our founders, Hector, presented the idea
          to us and we thought it was a great way to help students and make some
          money on the side. Currently on the UF Reddit and Snapchat, everyday
          there are numerous posts about finding rides to various cities, which
          we believe our platform can centralize and make it easier for students
          to find rides.
        </p>
      </div>

      <div className="flex flex-col items-center h-full w-full mt-16 px-6">
        <h1 className="text-4xl text-center text-black dark:text-white font-RobotoBold">
          Meet the founders
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 mt-16 items-center gap-8">
          {founders.map((founder, index) => (
            <div
              key={index}
              className="flex flex-col items-center gap-4 bg-slate-100 dark:bg-neutral-900 rounded-xl p-4"
            >
              <img
                src={founder.image}
                alt={founder.name}
                className="w-48 h-48 rounded-full"
              />
              <h2 className="text-2xl text-center text-black dark:text-white font-RobotoBold">
                {founder.name}
              </h2>
              <h3 className="text-lg text-center text-gray-700 dark:text-gray-300 font-RobotoRegular">
                {founder.role}
              </h3>
              <p className="text-lg max-w-96 text-center text-black dark:text-white font-RobotoRegular">
                {founder.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center h-full w-full mt-16 px-6">
        <h1 className="text-4xl text-center text-black dark:text-white font-RobotoBold">
          Ready to get a ride?
        </h1>
        <Button
          className="mt-2 w-48"
          radius="full"
          color="primary"
          size="lg"
          onClick={() => {
            navigate("/auth/signup");
          }}
        >
          Get a Ride
        </Button>
      </div>

      <div className="flex flex-col mb-16 items-center h-full w-full mt-16 px-6">
        <h1 className="text-4xl text-center text-black dark:text-white font-RobotoBold">
          UF Student Code of Conduct
        </h1>
        <Button
          className="mt-2 w-48"
          radius="full"
          color="primary"
          size="lg"
          onClick={() => {
            window.open(
              "https://policy.ufl.edu/wp-content/uploads/2021/12/4-040_2021-12-06.pdf",
              "_blank"
            );
          }}
        >
          Read More
        </Button>
      </div>

      <Footer />
    </div>
  );
};

export default About;
