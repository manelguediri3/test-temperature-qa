package karate;

import com.intuit.karate.junit5.Karate;

class TestRunner {

    @Karate.Test
    Karate testCapture() {
       return Karate.run("classpath:karate/capture");
    }

    @Karate.Test
    Karate testThresholds() {
         return Karate.run("classpath:karate/thresholds");
    }
}
