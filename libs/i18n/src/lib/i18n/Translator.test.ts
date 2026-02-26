import "reflect-metadata"

import { ConsoleTrace, TraceLevel, Tracer } from "@novx/core"

import { LocaleManager, LocalStorageLocaleBackingStore } from "../locale"
import { Translator } from "./Translator"
import { AssetTranslationLoader } from "./loader"
import { TranslatorBuilder } from "./TranslatorBuilder"


describe("translator", () => {
    // tracer

    new Tracer({
        enabled: true,
        trace: new ConsoleTrace("%d [%p]: %m\n"), // d(ate), l(evel), p(ath), m(message)
        paths: {
            aop: TraceLevel.FULL,
        },
    })

    // translator

    let translator: Translator | undefined = undefined;

    beforeAll(() => {
        translator = new TranslatorBuilder()
            .loader(new AssetTranslationLoader({ path: "/i18n/" }))
            .localeManager(
                new LocaleManager({
                    locale: "en",
                    supportedLocales: ["en"],
                    //backingStore: new LocalStorageLocaleBackingStore("language"),
                })
            )
            .build()
    })

    // manager

    it("should translate", () => {
        const translation = translator!.translate("namespace:key")

        expect(translation).toBe("##namespace:key##")
    })
})
