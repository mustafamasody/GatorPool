import React, { useState, useEffect } from 'react'

const HomePage = () => {

    const [test, setTest] = useState<string>("Test");

    return (
        <div>
            {test}
        </div>
    )
}

export default HomePage