const THREE_SAME = 0;
const ONE_TWO = 1;
const ONE_THREE = 2;
const TWO_THREE = 3;
const THREE_DIFF = 4;




// Adaptador de roles para combinar propiedad, estacionamiento y bodega
function adaptRol(rolPropiedad, rolEstacionamiento, rolBodega) {
  if(!rolPropiedad && !rolEstacionamiento && !rolBodega){
    return null;
  }  
  // Limpiar y validar roles
  const cleanedRoles = [
    cleanRol(rolPropiedad),
    cleanRol(rolEstacionamiento),
    cleanRol(rolBodega)
  ].filter(rol => rol !== null && rol !== undefined);
  
  // Si solo queda un rol válido, retornarlo directamente
  if(cleanedRoles.length === 1) {
    return cleanedRoles[0];
  }
  [rol1, rol2, rol3] = cleanedRoles;     
  const comparisonResult = checkFirstHalf(rol1,rol2,rol3);
  const finalRol = mergeRol(rolPropiedad,rolEstacionamiento,rolBodega,comparisonResult);
  return finalRol;
}

function checkFirstHalf(rolOne,rolTwo,rolThree){
  let result;
  if(rolOne && rolTwo && rolThree){
    result = checkThreeHalfs(rolOne, rolTwo, rolThree);
  }else if(rolOne && rolTwo){
    result = checkTwoHalfs(rolOne, rolTwo)? ONE_TWO : THREE_DIFF;
  }else if(rolOne && rolThree){
    result = checkTwoHalfs(rolOne,rolThree)? ONE_THREE : THREE_DIFF;
  }else if(rolTwo && rolThree){
    result = checkTwoHalfs(rolTwo,rolThree)? TWO_THREE: THREE_DIFF;
  }else{
    return null;
  }
  
  return result;
}

function checkThreeHalfs(rolOne,rolTwo,rolThree){
  const halfOne = rolOne.split("-")[0];
  const halfTwo = rolTwo.split("-")[0];
  const halfThree = rolThree.split("-")[0];
  console.log("Roles: ",halfOne,halfTwo, halfThree);
  if(halfOne == halfTwo && halfTwo == halfThree){
    return THREE_SAME;
  }else if(halfOne == halfTwo){
    return ONE_TWO;
  }else if(halfOne == halfThree){
    return ONE_THREE;
  }else if(halfTwo == halfThree){
    return TWO_THREE;
  }else if(halfOne != halfTwo && halfOne != halfThree && halfTwo != halfThree){
    return THREE_DIFF;
  }else{
    return null;
  }
}

function checkTwoHalfs(rolOne, rolTwo){
  const halfOne = rolOne.split("-")[0];
  const halfTwo = rolTwo.split("-")[0];
  
  if(halfOne == halfTwo){
    return true;
  }else if(halfOne != halfTwo){
    return false;
  }else{
    return null;
  }
}

function mergeRol(rol1,rol2,rol3,areSame){
  let final;
  switch(areSame){
    case THREE_SAME:
      console.log("3 iguales");
      final = mergeThreeRoles(rol1,rol2,rol3);
      break;
      
    case ONE_TWO:
      console.log("1 y 2 iguales");
      final = mergeDiffRoles(mergeTwoRoles(rol1,rol2),rol3)
      break;
    
    case ONE_THREE:
      console.log("1 y 3 iguales");

      final = mergeDiffRoles(mergeTwoRoles(rol1,rol3),rol2)
      break;
      
    case TWO_THREE:
      console.log("2 y 3 iguales");  
      final = mergeDiffRoles(mergeTwoRoles(rol2,rol3),rol1)
      break;
    case THREE_DIFF:
      console.log("3 diferentes");
      final = mergeDiffRoles(rol1,rol2,rol3)
      
      break;
    default:
      final = null;
        
  }
  return final;
}

function mergeDiffRoles(rol1=null,rol2=null,rol3=null){
  if(rol1 && rol2 && rol3){
    return rol1 + "//" + rol2 + "//" + rol3;
  }else if(rol1 && rol2){
    return rol1 + "//" + rol2;
  }else if(rol1 && rol3){
    return rol1 + "//" + rol3;
  }else if(rol2 && rol3){
    return rol2 + "//" + rol3;
  }
}

    // Funciones para unir dos roles
    function mergeTwoRoles(rolOne, rolTwo) {
        if (!rolOne.includes("-") || !rolTwo.includes("-")) {
            return null;
        }
        const arrayRolOne = rolOne.split("-");
        const arrayRolTwo = rolTwo.split("-");
        if (arrayRolOne[0] === arrayRolTwo[0]) {
            rolOne += "-" + arrayRolTwo[1];
        }
        rolOne = rolOne.replace(/\s*/g, "");
        return rolOne;
    }

    // Función para unir tres roles
    function mergeThreeRoles(rolOne, rolTwo, rolThree) {
        let twoRoles = mergeTwoRoles(rolOne, rolTwo);
        if (!twoRoles || !twoRoles.includes("-") || !rolThree.includes("-")) {
            if (twoRoles && twoRoles.includes("-")) {
                return twoRoles;
            } else if (rolOne.includes("-") && rolThree.includes("-")) {
                return mergeTwoRoles(rolOne, rolThree);
            }
            return null;
        }
        const arrayTwoRoles = twoRoles.split("-");
        const arrayRolThree = rolThree.split("-");
        if (arrayTwoRoles[0] == arrayRolThree[0]) {
            twoRoles += "-" + arrayRolThree[1];
        }
        return twoRoles
    }

//Función para limpiar los roles de espacios de sobre, guiones largos y ceros iniciales
    function cleanRol(rol) {
        if (!rol) {
            return null;
        }
        rol = rol.replace("−", "-");
        if (!rol.includes("-")) {
            return rol;
        }
        const parts = rol.split("-");
        const newFirst = cleanInitialZeros(parts[0]);
        const newSecond = cleanInitialZeros(parts[1]);
        return newFirst + "-" + newSecond;
}