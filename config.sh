#!/bin/bash

if [ -f ".env" ]
then
	echo "Starting to replace the env variables on the source code"

	if [ "$(tail -c1 ".env"; echo x)" != $'\nx' ]; then
		echo "" >>".env" # Adds new line to env file if there isn't. Why? To read all properties.
	fi
	
	egrep -Rl --include=*.js  "__VITE_" | while read -r jsFile ;do
		echo "Processing $jsFile"
		while IFS= read -r line; do
			key=`echo ${line%%=*} | sed 's/ *$//g'` # Extracts the key by reading the text before the first = and removes  any trailing and leading white space
			value=`echo ${line#*=} | sed 's/ *$//g'` # Extracts the value by reading the text after the first = and removes  any trailing and leading white space
			escaped_value=$(printf '%s\n' "$value" | sed -e 's/[\/&]/\\&/g') #escaped sed special charachters (forward slash and & charachters)
			if [[ ${key} == *"VITE_"* ]]; then
				printf " Replacing key with value: %s=%s\n" "${key}" "${escaped_value}"
				sed -i "s#__${key}__#${escaped_value}#g" $jsFile
			fi		
		done < ".env"
	done
	
else
  echo "$file not found."  1>&2
  exit 64
fi

