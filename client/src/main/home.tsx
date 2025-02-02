import { Button } from '@heroui/react';
import React, { useState, useEffect } from 'react'
import Navbar from './components/navbar';

const HomePage = () => {

    const [test, setTest] = useState<string>("Test");

    return (
        <div className="flex flex-col min-h-screen w-full">

            <Navbar />

                <h1 className="text-6xl font-bold underline">
      Hello world!
    </h1>
            {test}

            <Button color="primary" onPress={() => setTest("Test2")}>Click me</Button>
        </div>
    )
}

export default HomePage