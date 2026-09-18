Feature: capture helper

  Background:
    * url baseUrl

  Scenario:
    Given path '/api/temperature/capture'
    When method post
    Then status 201