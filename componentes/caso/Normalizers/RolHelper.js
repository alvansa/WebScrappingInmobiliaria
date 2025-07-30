const {cleanInitialZeros} = require('../../../utils/cleanStrings');

const ComparacionRoles = {
    THREE_SAME: 0,
    ONE_TWO_SAME: 1,
    ONE_THREE_SAME: 2,
    TWO_THREE_SAME: 3,
    THREE_DIFF: 4,
}

class RolHelper{
    // Adaptador de roles para combinar propiedad, estacionamiento y bodega
    static normalizeRol(rolPropiedad, rolEstacionamiento, rolBodega) {
        let rol1, rol2, rol3;
        if (!rolPropiedad && !rolEstacionamiento && !rolBodega) {
            return null;
        }
        // Limpiar y validar roles
        const cleanedRoles = [
            this.cleanRol(rolPropiedad),
            this.cleanRol(rolEstacionamiento),
            this.cleanRol(rolBodega)
        ].filter(rol => rol !== null && rol !== undefined);

        // Si solo queda un rol válido, retornarlo directamente
        if (cleanedRoles.length === 1) {
            return cleanedRoles[0];
        }
        [rol1, rol2, rol3] = cleanedRoles;
        const comparisonResult = this.checkFirstHalves(rol1, rol2, rol3);
        const finalRol = this.mergeRol(rol1, rol2, rol3, comparisonResult);
        return finalRol;
    }

    static checkFirstHalves(rolOne, rolTwo, rolThree) {
        let result;
        if (rolOne && rolTwo && rolThree) {
            result = this.checkThreeHalfs(rolOne, rolTwo, rolThree);
        } else if (rolOne && rolTwo) {
            result = this.checkTwoHalfs(rolOne, rolTwo) ? ComparacionRoles.ONE_TWO_SAME : ComparacionRoles.THREE_DIFF;
        } else if (rolOne && rolThree) {
            result = this.checkTwoHalfs(rolOne, rolThree) ? ComparacionRoles.ONE_THREE_SAME : ComparacionRoles.THREE_DIFF;
        } else if (rolTwo && rolThree) {
            result = this.checkTwoHalfs(rolTwo, rolThree) ? ComparacionRoles.TWO_THREE_SAME : ComparacionRoles.THREE_DIFF;
        } else {
            return null;
        }
        return result;
    }

    static checkThreeHalfs(rolOne, rolTwo, rolThree) {
        const halfOne = rolOne.split("-")[0];
        const halfTwo = rolTwo.split("-")[0];
        const halfThree = rolThree.split("-")[0];
        if (halfOne == halfTwo && halfTwo == halfThree) {
            return ComparacionRoles.THREE_SAME;
        } else if (halfOne == halfTwo) {
            return ComparacionRoles.ONE_TWO_SAME;
        } else if (halfOne == halfThree) {
            return ComparacionRoles.ONE_THREE_SAME;
        } else if (halfTwo == halfThree) {
            return ComparacionRoles.TWO_THREE_SAME;
        } else if (halfOne != halfTwo && halfOne != halfThree && halfTwo != halfThree) {
            return ComparacionRoles.THREE_DIFF;
        } else {
            return null;
        }
    }

    static checkTwoHalfs(rolOne, rolTwo) {
        const halfOne = rolOne.split("-")[0];
        const halfTwo = rolTwo.split("-")[0];

        if (halfOne == halfTwo) {
            return true;
        } else if (halfOne != halfTwo) {
            return false;
        } else {
            return null;
        }
    }

    static mergeRol(rol1, rol2, rol3, areSame) {
        let final;
        switch (areSame) {
            case ComparacionRoles.THREE_SAME:
                final = this.mergeThreeRoles(rol1, rol2, rol3);
                break;

            case ComparacionRoles.ONE_TWO_SAME:
                final = this.mergeDiffRoles(this.mergeTwoRoles(rol1, rol2), rol3);
                break;

            case ComparacionRoles.ONE_THREE_SAME:
                final = this.mergeDiffRoles(this.mergeTwoRoles(rol1, rol3), rol2)
                break;

            case ComparacionRoles.TWO_THREE_SAME:
                final = this.mergeDiffRoles(this.mergeTwoRoles(rol2, rol3), rol1)
                break;

            case ComparacionRoles.THREE_DIFF:
                final = this.mergeDiffRoles(rol1, rol2, rol3)
                break;

            default:
                final = null;
        }
        return final;
    }

    static mergeDiffRoles(rol1 = null, rol2 = null, rol3 = null) {
        if (rol1 && rol2 && rol3) {
            return rol1 + "//" + rol2 + "//" + rol3;
        } else if (rol1 && rol2) {
            return rol1 + "//" + rol2;
        } else if (rol1 && rol3) {
            return rol1 + "//" + rol3;
        } else if (rol2 && rol3) {
            return rol2 + "//" + rol3;
        } else if (rol1) {
            return rol1;
        }
    }

    // Funciones para unir dos roles
    static mergeTwoRoles(rolOne, rolTwo) {
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
    static mergeThreeRoles(rolOne, rolTwo, rolThree) {
        let twoRoles = this.mergeTwoRoles(rolOne, rolTwo);
        if (!twoRoles || !twoRoles.includes("-") || !rolThree.includes("-")) {
            if (twoRoles && twoRoles.includes("-")) {
                return twoRoles;
            } else if (rolOne.includes("-") && rolThree.includes("-")) {
                return this.mergeTwoRoles(rolOne, rolThree);
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
    static cleanRol(rol) {
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

}

module.exports = RolHelper;