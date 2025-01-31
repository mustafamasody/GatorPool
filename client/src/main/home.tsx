import React, { useState, useEffect } from 'react'

const HomePage = () => {

    const [test, setTest] = useState<string>("Test");

    return (
        <div>
                <h1 className="text-6xl font-bold underline">
      Hello world!
    </h1>
            {test}
        </div>
    )
}

export default HomePage