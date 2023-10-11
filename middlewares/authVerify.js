const jwt = require('jsonwebtoken')
const userSecret = process.env.USER_SECRET
const userTokenVerify = async (req,res,next) => {
  try {
    let token = req.headers.autherization;
    if (!token) {
      return res.status(403).json({message:"Access Denied"});
    }
    if(token.startsWith("Bearer ")){
      token = token.slice(7, token.length).trimLeft();
    }
    const verified = jwt.verify(token,userSecret)
    req.user = verified
    console.log(verified);
    if (verified.role == "user") {
      next();
    } else {
      return res.status(403).json({message:"Access Denied"});
    }
  } catch (error) {
    console.log(error.message);
  }
}

module.exports = {
  userTokenVerify
}















