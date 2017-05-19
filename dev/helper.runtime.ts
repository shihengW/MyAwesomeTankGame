function applyMixins(derivedCtor: any, baseCtors: any[]) {
    baseCtors.forEach(baseCtor => {
        Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
            derivedCtor.prototype[name] = baseCtor.prototype[name];
        });
    });
}

class MobileChecker {
    private static Android() : RegExpMatchArray {
        return navigator.userAgent.match(/Android/i);
    }

    private static BlackBerry() : RegExpMatchArray {
        return navigator.userAgent.match(/BlackBerry/i);
    }

    private static iOS() : RegExpMatchArray {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    }

    private static Opera() : RegExpMatchArray {
        return navigator.userAgent.match(/Opera Mini/i);
    }

    private static Windows() : RegExpMatchArray {
        return navigator.userAgent.match(/IEMobile/i);
    }

    static isMobile() : RegExpMatchArray {
        return (MobileChecker.Android() || MobileChecker.BlackBerry() || MobileChecker.iOS() || MobileChecker.Opera() || MobileChecker.Windows());
    }
};