import React from 'react'

const kmkm = () => {
    const BackendURL = import.meta.env.VITE_BACKEND_URL;
    const (register , handelSubmit) = useForm()
    const handelSubmitButton = async(data)=>{
        try{
            const res = await.post(`${BackendURL}`,{email:data.email})
            if(res.status == 200){
                NavigateEvent("/home")
            }
        }
    }
  return (
    <div>
      
    </div>
  )
}

export default kmkm
