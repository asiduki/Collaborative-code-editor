import axios from 'axios'
import { AnimatePresence } from 'framer-motion';
import { Repeat } from 'lucide-react';
import React, { useEffect, useState } from 'react'

const CodeConverter = () => {
    const [loading , setloading] = useState(true);

    useEffect(()=>{
        const timer = setTimeout(()=>{
            setloading(true);
        },1500)

        return()=> clearTimeout(timer);
    },[])
  return (
    <AnimatePresence>
        {loading ? ( <motion.div key="loader" initial={{opacity:0}} animate={{opacity:1}} className='w-full h-screen '>
            <motion.div animate={{rotate:360}} transition={{duration:1 , repeat:Infinity}} className="w-12 h-12 rounded-full border-4 border-white/40 border-t-black"
            />
        </motion.div>):(
            <>
                
            </>
        )}
       
    </AnimatePresence>
  )
}

export default CodeConverter
